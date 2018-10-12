class Sandboxe {
    constructor() {
        const t = this

        // DOM
        t.$container = document.querySelector(".sandboxe-game__canvas")
        t.$colors = document.querySelector(".sandboxe-game__colors")
        t.$colorSlideRed = document.querySelector(".sandboxe-game__slideRed")        
        t.$colorSlideGreen = document.querySelector(".sandboxe-game__slideGreen")
        t.$colorSlideBlue = document.querySelector(".sandboxe-game__slideBlue")
        t.$colorResult = document.querySelector(".sandboxe-game__result")
        t.$header = document.querySelector(".sandboxe-game__header")

        // variable urls
        THREEx.ArToolkitContext.baseURL = './assets/markers/'

        // taille de l'écran
        t.ww = window.innerWidth
        t.wh = window.innerWidth

        // toutes les couleurs
        t.colors = {
            white: 0xffffff,
            red: 0x00ffff
        }

        // loop des functions
        t.onRenderFcts = []

        // scene
        t.scene = new THREE.Scene()

        // flag
        t.elementSelected = false

        // grille
        t.gridSize = 3
        t.sizeCube = 1

        // Default color
        t.cubeColor = "#00FFFF";
        t.$colorResult.style.backgroundColor = t.cubeColor


        t.init()
    }

    init() {
        const t = this

        t.createRenderer()
        t.createCamera()
        t.createArToolKitSource()

        t.bindEvents()

        t.initArToolKitSource()
        t.initMarker()
        t.initDetectMarker()
        t.initRenderer()

        t.animationFrame()
    }

    createRenderer() {
        const t = this

        // création éléments
        t.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true
        })

        // lui ajoute les propriétés
        t.renderer.setClearColor(new THREE.Color('lightgrey'), 0)
        t.renderer.setSize(t.ww, t.wh)
        t.renderer.domElement.classList.add("sandboxe-game__canvas")

        // ajoute au dom
        document.body.insertBefore(t.renderer.domElement, t.$header);
    }

    createCamera() {
        const t = this

        // TODO === regarder si ne pas mettre camera perspective ?
        t.camera = new THREE.PerspectiveCamera( 75, t.ww / t.wh, 0.1, 1000 )
        t.scene.add(t.camera)
    }

    createArToolKitSource() {
        const t = this

        t.arToolkitSource = new THREEx.ArToolkitSource({
            sourceType: 'webcam',
        })

        // TODO === vérifier si fonction est : trigger un resize à son initialisation ?
        t.arToolkitSource.init(function onReady() {
            t.resize()
        })
    }

    bindEvents() {
        const t = this

        document.addEventListener("resize", t.resize.bind(t))
        

        // permet d'intéragir avec le DOM
        t.domEvents	= new THREEx.DomEvents(t.camera, t.renderer.domElement)

        // Change color
        t.$colorSlideRed.addEventListener("change", t.updateCubeColor.bind(t))
        t.$colorSlideGreen.addEventListener("change", t.updateCubeColor.bind(t))
        t.$colorSlideBlue.addEventListener("change", t.updateCubeColor.bind(t))
    }

    resize() {
        const t = this

        // recalcule les valeurs de notre écran
        t.ww = window.innerWidth
        t.wh = window.innerHeight

        // gestion arToolKit
        t.arToolkitSource.onResizeElement()
        t.arToolkitSource.copyElementSizeTo(t.renderer.domElement)
        if (t.arToolkitContext.arController !== null) {
            t.arToolkitSource.copyElementSizeTo(t.arToolkitContext.arController.canvas)
        }
    }

    initArToolKitSource() {
        const t = this

        // créer un context
        t.arToolkitContext = new THREEx.ArToolkitContext({
            cameraParametersUrl: THREEx.ArToolkitContext.baseURL + 'camera_para.dat',
            detectionMode: 'mono',
        })

        // lance init
        t.arToolkitContext.init(function onCompleted() {
            // TODO : à checker === copy projection matrix to camera
            t.camera.projectionMatrix.copy(t.arToolkitContext.getProjectionMatrix());
        })

        // TODO === garde le tableau ou tout das une fonction ?
        // ajoute la fonction au tableau qui stocke les fonctions pour le loop
        t.onRenderFcts.push(function () {
            if (t.arToolkitSource.ready === false) return
            t.arToolkitContext.update(t.arToolkitSource.domElement)
        })
    }

    initMarker() {
        const t = this

        // création d'un groupe d'éléments
        let grid = new THREE.Group()

        // donne un nom au groupe pour le récupérer dans la scene
        grid.name = 'grid'

        // ajoute à la scene
        t.scene.add(grid)

        // récupère le marker que l'on doit chercher
        let controls = new THREEx.ArMarkerControls(t.arToolkitContext, grid, {
            type: 'pattern',
            patternUrl: THREEx.ArToolkitContext.baseURL + 'patt.hiro',
        })

        // let sizeGroupe = t.sizeCube * t.gridSize + (t.gap *  (t.gridSize - 1 ) )

        let count = 0

        // création de la grille lui sera liée
        for (let i = 0; i < t.gridSize ; i++) {
            for (let j = 0; j < t.gridSize ; j++) {

                let geometry = new THREE.BoxGeometry(t.sizeCube, t.sizeCube, t.sizeCube)
                // let material = new THREE.MeshBasicMaterial({color: t.colors.white, wireframe: true})
                let material = new THREE.MeshBasicMaterial({color: t.cubeColor, wireframe: true})
                let mesh = new THREE.Mesh(geometry, material)

                mesh.position.x = ( i * t.sizeCube ) - ( ( t.gridSize - 1 ) / 2 * t.sizeCube )
                mesh.position.z = ( j * t.sizeCube ) - ( ( t.gridSize - 1 ) / 2 * t.sizeCube )

                mesh.name = 'mesh-' + count++

                // ajoute à notre groupe
                grid.add(mesh)

                // chacun des block on ajoute un écouteur d'évènements
                t.domEvents.addEventListener( mesh, 'click', function() {
                    t.updateMesh(mesh.name)
                    // alert("click "+ mesh.name)
                })
            }
        }
    }

    initDetectMarker() {
        const t = this

        let grid = t.scene.getObjectByName('grid')

        t.onRenderFcts.push(function () {

            if ( t.elementSelected && grid.visible ) {
                t.$colors.classList.remove("hidden")
            }
            else {
                t.$colors.classList.add("hidden")
            }
        })
    }

    initRenderer() {
        const t = this

        // ajoute renderer au tableau d'update
        t.onRenderFcts.push(function () {
            t.renderer.render(t.scene, t.camera);
        })
    }

    animationFrame() {
        const t = this

        requestAnimationFrame(function animate(nowMsec) {
            // lance la boucle
            requestAnimationFrame(animate);

            // measure time
            t.lastTimeMsec = t.lastTimeMsec || nowMsec - 1000 / 60
            let deltaMsec = Math.min(200, nowMsec - t.lastTimeMsec)
            t.lastTimeMsec = nowMsec

            // appelle les function d'update que l'on vait stocké dans un tableau
            t.onRenderFcts.forEach(function (onRenderFct) {
                onRenderFct(deltaMsec / 1000, nowMsec / 1000)
            })
        })
    }

    updateMesh(name) {
        const t = this

        console.log("updateMesh", name)

        let mesh = t.scene.getObjectByName(name)
        // let material = new THREE.MeshBasicMaterial({color: t.colors.red})
        let material = new THREE.MeshBasicMaterial({color: t.cubeColor})

        mesh.material = material
    }

    rgbToHex(rgb) { 
        const t = this

        let hex = Number(rgb).toString(16);
        if (hex.length < 2) {
             hex = "0" + hex;
        }
        return hex;
    }

    fullColorHex(r,g,b) {   
        const t = this

        let red = t.rgbToHex(r);
        let green = t.rgbToHex(g);
        let blue = t.rgbToHex(b);
        return "#"+red+green+blue;
    }

    updateCubeColor() {
        const t = this

        console.log(t.$colorSlideRed.value);
        console.log(t.$colorSlideGreen.value);
        console.log(t.$colorSlideBlue.value);
        

        t.cubeColor = t.fullColorHex(t.$colorSlideRed.value,t.$colorSlideGreen.value,t.$colorSlideBlue.value);
        t.$colorResult.style.backgroundColor = t.cubeColor

        console.log(t.cubeColor);
        
    }

}

new Sandboxe()
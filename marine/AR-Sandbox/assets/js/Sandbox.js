class Sandboxe {
    constructor() {
        const t = this

        /**
         *  DOM
         */
        // Header
        t.$header = document.querySelector(".sandboxe-game__header")
        // Canvas container
        t.$container = document.querySelector(".sandboxe-game__canvas")
        // Interface
        t.$interface = document.querySelector(".sandboxe-game__interface")
        // Mode
        t.$modeDiv = document.querySelector(".sandboxe-game__mode span")
        // Colors
        t.$colors = document.querySelector(".sandboxe-game__colors")
        t.$colorSlideChroma = document.querySelector(".sandboxe-game__slideChroma")
        t.$colorResult = document.querySelector(".sandboxe-game__result")
        // Buttons
        t.$buttonEdit = document.querySelector(".sandboxe-game__editButton")
        t.$buttonRemove = document.querySelector(".sandboxe-game__removeButton")
        

        // variable urls
        THREEx.ArToolkitContext.baseURL = './assets/markers/'

        // taille de l'écran
        t.ww = window.innerWidth
        t.wh = window.innerWidth

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
        t.cubeColor = "#00FFF7";
        t.$colorResult.style.backgroundColor = t.cubeColor

        // Default mode
        t.$modeEdition = false;

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
        t.$colorSlideChroma.addEventListener("change", t.updateCubeColor.bind(t))

        // Edit button
        t.$buttonEdit.addEventListener("click", t.editMode.bind(t))
        t.$buttonRemove.addEventListener("click", t.removeCube.bind(t))
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
                let material = new THREE.MeshBasicMaterial({color: "#000000", wireframe: true})
                let mesh = new THREE.Mesh(geometry, material)

                mesh.position.x = ( i * t.sizeCube ) - ( ( t.gridSize - 1 ) / 2 * t.sizeCube )
                mesh.position.z = ( j * t.sizeCube ) - ( ( t.gridSize - 1 ) / 2 * t.sizeCube )

                mesh.name = 'mesh-' + count++
                mesh.new = true;
                mesh.active = false;

                // ajoute à notre groupe
                grid.add(mesh)

                // chacun des block on ajoute un écouteur d'événements
                t.domEvents.addEventListener( mesh, 'click', function() {

                    // Si on est en mode edition
                    if (t.$modeEdition) {
                        // Si le cube existe déjà
                        if (!mesh.new) {
                            // Si le cube est déjà actif
                            if (mesh.active) {
                                // Désactivation du cube
                                t.cubeInactive(mesh.name)
                            } else {
                                // Activation du cube
                                t.cubeActive(mesh.name)
                            }
                        } else {
                            // Ajout du cube
                            t.updateMesh(mesh.name)
                        }

                        // Cube ajouté
                        mesh.new = false;

                        // alert("click "+ mesh.name)
                    }
                    
                })
            }
        }
    }

    initDetectMarker() {
        const t = this

        let grid = t.scene.getObjectByName('grid')

        t.onRenderFcts.push(function () {

            // if ( t.elementSelected && grid.visible ) {
            //     t.$colors.classList.remove("hidden")
            // }
            // else {
            //     t.$colors.classList.add("hidden")
            // }
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
        let material = new THREE.MeshBasicMaterial({color: t.cubeColor})

        mesh.material = material

        console.log("updateMesh", mesh.active)
    }

    hslToHex(h, s, l) {
        h /= 360;
        s /= 100;
        l /= 100;
        let r, g, b;
        if (s === 0) {
            r = g = b = l; // achromatic
        } else {
            const hue2rgb = (p, q, t) => {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1 / 6) return p + (q - p) * 6 * t;
                if (t < 1 / 2) return q;
                if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
                return p;
            };
            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            r = hue2rgb(p, q, h + 1 / 3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1 / 3);
        }
        const toHex = x => {
            const hex = Math.round(x * 255).toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        };

        return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    }

    updateCubeColor() {
        const t = this
        
        t.cubeColor = t.hslToHex(t.$colorSlideChroma.value,100,50);
        t.$colorResult.style.backgroundColor = 'hsl(' + t.$colorSlideChroma.value + ', 100%, 50%)'

        // Loop sur les éléments Mesh
        t.scene.traverse( function( node ) {
            if ( node instanceof THREE.Mesh ) {
                // Si le cube est sélectionné
                if (node.active) {
                    // Changement de couleur
                    let material = new THREE.MeshBasicMaterial({color: t.cubeColor})
                    node.material = material
                    t.cubeInactive(node.name)
                } 
            }
        } );
    }

    editMode() {
        const t = this                

        // Si on est en mode vue, on passe en mode edition
        if (t.$interface.classList.contains('vue')) {
            // Interface en mode edition
            t.$interface.classList.remove('vue'); 
            t.$interface.classList.add('edition'); 
            t.$modeDiv.innerHTML = "Edition"; 
            // Button edit
            t.$buttonEdit.querySelector('p').innerHTML = "Retour Vue";  
            // Affichage des couleurs
            t.$colors.classList.remove('hidden');  
            // Mode edition à true -> autoriser le click sur la grille 
            t.$modeEdition = true;
        
        // Si on est en mode édition, on passe en mode vue
        } else {
            // Interface en mode vue
            t.$interface.classList.remove('edition');
            t.$interface.classList.add('vue');
            t.$modeDiv.innerHTML = "Vue";
            // Button edit
            t.$buttonEdit.querySelector('p').innerHTML = "Editer";  
            // Button remove
            t.$buttonRemove.classList.add('hidden');
            // Ne pas afficher les couleurs   
            t.$colors.classList.add('hidden'); 
            // Mode edition à false -> ne pas autoriser le click sur la grille  
            t.$modeEdition = false;
        }
    }

    cubeActive(name) {
        const t = this

        let mesh = t.scene.getObjectByName(name)

        // Cube actif
        mesh.active = true;

        // Afficher le button remove
        t.$buttonRemove.classList.remove('hidden');

        console.log("cubeActive", mesh.active)
    }

    cubeInactive(name) {
        const t = this

        let mesh = t.scene.getObjectByName(name)

        // Cube inactif
        mesh.active = false;

        // Ne pas afficher le button remove
        t.$buttonRemove.classList.add('hidden');

        console.log("cubeInactive", mesh.active)
    }

    removeCube() {
        const t = this

        // Loop sur les éléments Mesh
        t.scene.traverse( function( node ) {
            if ( node instanceof THREE.Mesh ) {
                // Si le cube est sélectionné
                if (node.active) {
                    // Couleur transparentes sur le cube
                    let material = new THREE.MeshBasicMaterial({color: "#000000", wireframe: true })
                    node.material = material
                    t.cubeInactive(node.name)
                } 
            }
        } );

        // Ne pas afficher le button remove
        t.$buttonRemove.classList.add('hidden');
    }

}

new Sandboxe()
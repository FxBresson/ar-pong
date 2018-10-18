class Sandboxe {
    constructor(infos) {
        const t = this

        // le marker
        t.pattern = infos.pattern
        t.id = infos.id

        // DOM
        t.$container = document.querySelector(".sandboxe-game__canvas")
        t.$header = document.querySelector(".sandboxe-game__header")
        t.$buttonEdit = document.querySelector(".sandboxe-game__button--edit")
        t.$buttonDelete = document.querySelector(".sandboxe-game__button--delete")
        t.$buttonAdd = document.querySelector(".sandboxe-game__button--add")
        t.$colors = document.querySelector(".sandboxe-game__colors")
        t.$colorSlideChroma = document.querySelector(".sandboxe-game__slide-chroma")
        t.$colorResult = document.querySelector(".sandboxe-game__result")
        t.$colorResult.style.opacity = 1

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
        t.isSeen = false
        window.isEdition = false
        window.isAdding = false

        // valeur du jeu
        t.gridSize = 3

        t.init()
    }

    init() {
        const t = this

        t.createRenderer()
        t.createCamera()
        t.createLight()
        t.createArToolKitSource()

        t.createVariables()
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
        document.body.insertBefore(t.renderer.domElement, t.$header)
    }

    createCamera() {
        const t = this

        t.camera = new THREE.PerspectiveCamera(75, t.ww / t.wh, 0.1, 1000)
        t.scene.add(t.camera)
    }

    createLight() {
        const t = this

        let light = new THREE.PointLight(0xffffff, 5, 100);
        t.scene.add(light)
    }

    createArToolKitSource() {
        const t = this

        t.arToolkitSource = new THREEx.ArToolkitSource({
            sourceType: 'webcam',
        })

        t.arToolkitSource.init(function onReady() {
            t.resize()
        })
    }

    createVariables() {
        const t = this

        // permet d'intéragir avec le DOM >>> est envoyé dans la class Cube
        t.domEvents = new THREEx.DomEvents(t.camera, t.renderer.domElement)

        // élements que l'on va passer dans notre class Cube
        t.three = {
            scene: t.scene,
            domEvents: t.domEvents
        }

        t.dom = {
            $colorSlideChroma: t.$colorSlideChroma
        }
    }

    bindEvents() {
        const t = this

        // resize
        document.addEventListener("resize", t.resize.bind(t))

        // change color
        t.$colorSlideChroma.addEventListener("change", t.updateCubeColor.bind(t))

        // change l'alpha
        t.$colorResult.addEventListener("click", t.updateAlphaCube.bind(t))

        // edit button
        t.$buttonEdit.addEventListener("click", t.editMode.bind(t))
        t.$buttonAdd.addEventListener("click", t.addMode.bind(t))
        t.$buttonDelete.addEventListener("click", t.removeCube.bind(t))

        // watcher évènements lancés depuis les classes Cubes
        window.addEventListener("hideButtonDelete", t.hideButtonDelete.bind(t))
        window.addEventListener("showButtonDelete", t.showButtonDelete.bind(t))
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
            t.camera.projectionMatrix.copy(t.arToolkitContext.getProjectionMatrix())
        })

        // ajoute la fonction au tableau qui stocke les fonctions pour le loop
        t.onRenderFcts.push(() => {
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

        // ajoute le marker que l'on doit "voir" à notre grille
        new THREEx.ArMarkerControls(t.arToolkitContext, grid, {
            type: 'pattern',
            patternUrl: THREEx.ArToolkitContext.baseURL + t.pattern,
        })
    }

    initDetectMarker() {
        const t = this

        let grid = t.scene.getObjectByName('grid')

        t.onRenderFcts.push(() => {

            if (grid.visible && !t.isSeen) t.getCubes()
        })
    }

    initRenderer() {
        const t = this

        // ajoute renderer au tableau d'update
        t.onRenderFcts.push(() => {
            t.renderer.render(t.scene, t.camera)
        })
    }

    animationFrame() {
        const t = this

        requestAnimationFrame(function animate(nowMsec) {

            // lance la boucle
            requestAnimationFrame(animate)

            // measure time
            t.lastTimeMsec = t.lastTimeMsec || nowMsec - 1000 / 60
            let deltaMsec = Math.min(200, nowMsec - t.lastTimeMsec)
            t.lastTimeMsec = nowMsec

            // appelle les function d'update que l'on vait stocké dans un tableau
            t.onRenderFcts.forEach((onRenderFct) => {
                onRenderFct(deltaMsec / 1000, nowMsec / 1000)
            })
        })
    }

    getCubes() {
        const t = this

        // met le flag à true pour en pas repasser dans la fonction
        t.isSeen = true

        // appelle le serveur pour récupérer les cubes associées au marker
        t.cubesRegistered = [
            {
                position: {
                    x: 0,
                    y: 0,
                    z: 0
                },
                color: 0xff0000,
                alpha: 0.5,
                wireframe: false,
                status: "show",
                _id: 0,
            },
            {
                position: {
                    x: 0,
                    y: 0,
                    z: 1
                },
                color: 0xff0000,
                alpha: 1,
                wireframe: false,
                status: "show",
                _id: 1,
            },
            {
                position: {
                    x: 0,
                    y: 0,
                    z: 2
                },
                color: 0x00ff00,
                alpha: 1,
                wireframe: false,
                status: "show",
                _id: 2,
            },
            {
                position: {
                    x: 1,
                    y: 0,
                    z: 0
                },
                color: 0xfffff,
                alpha: 1,
                wireframe: true,
                status: "wireframe",
                _id: 3,
            },
            {
                position: {
                    x: 1,
                    y: 0,
                    z: 1
                },
                color: 0xfffff,
                alpha: 1,
                wireframe: true,
                status: "wireframe",
                _id: 4,
            },
            {
                position: {
                    x: 1,
                    y: 0,
                    z: 2
                },
                color: 0xfffff,
                alpha: 1,
                wireframe: true,
                status: "wireframe",
                _id: 5,
            },
            {
                position: {
                    x: 2,
                    y: 0,
                    z: 0
                },
                color: 0xfffff,
                alpha: 1,
                wireframe: true,
                status: "hidding",
                _id: 6,
            },
            {
                position: {
                    x: 2,
                    y: 0,
                    z: 1
                },
                color: 0xfffff,
                alpha: 1,
                wireframe: true,
                status: "hidding",
                _id: 7,
            },
            {
                position: {
                    x: 2,
                    y: 0,
                    z: 2
                },
                color: 0xfffff,
                alpha: 1,
                wireframe: true,
                status: "hidding",
                _id: 8,
            }
        ]

        // on créer les cubes
        for (let cubeRegister of t.cubesRegistered ) {

            // on append le cube
            new Cube(cubeRegister, t.three, t.dom)
        }
    }

    updateCubeColor() {
        const t = this

        // change la couleur
        let cubeColor = Website.hslToHex(t.$colorSlideChroma.value, 100, 50);
        t.$colorResult.style.backgroundColor = 'hsl(' + t.$colorSlideChroma.value + ', 100%, 50%)'

        // récupère l'alpha
        let alphaCube = t.$colorResult.style.opacity

        // prépare l'event
        let event = new CustomEvent('changeColor',
            {
                detail: {
                    color: cubeColor,
                    alpha: alphaCube
                }
            })

        // trigger event de mise à jour de la couleur
        window.dispatchEvent(event)
    }

    updateAlphaCube() {
        const t = this

        // change l'alpha
        let alphaCube = Number(t.$colorResult.style.opacity) === 1 ? 0.5 : 1
        t.$colorResult.style.opacity = alphaCube

        // récupère la couleur
        let cubeColor = Website.hslToHex(t.$colorSlideChroma.value, 100, 50);

        // prépare l'event
        let event = new CustomEvent('changeColor',
            {
                detail: {
                    color: cubeColor,
                    alpha: alphaCube,
                }
            })

        // trigger event de mise à jour de la couleur
        window.dispatchEvent(event)
    }

    editMode() {
        const t = this

        // si active on revient au mode vue
        if (t.$buttonEdit.classList.contains('active')) {

            // changement des boutons
            t.$colors.classList.add('hidden')
            t.$buttonDelete.classList.add('hidden')
            t.$buttonAdd.classList.remove('hidden')

            // Mode edition à false -> dé-autoriser le click sur la grille
            window.isEdition = false

            // désélectionne tous les cubes
            window.dispatchEvent( new CustomEvent("cubeDeselected") )
        } else {

            // changement des boutons
            t.$colors.classList.remove('hidden')
            t.$buttonAdd.classList.add('hidden')

            // trigger change pour setter la couleur dans le result petit timer pour l'alpha
            t.$colorSlideChroma.dispatchEvent(new Event('change'))

            // Mode edition à true -> autoriser le click sur la grille
            window.isEdition = true
        }

        // met à jour la class
        t.$buttonEdit.classList.toggle('active')
    }

    addMode() {
        const t = this

        // si active on revient au mode vue
        if (t.$buttonAdd.classList.contains('active')) {

            // changement des boutons
            t.$colors.classList.add('hidden')
            t.$buttonDelete.classList.add('hidden')
            t.$buttonEdit.classList.remove('hidden')

            // trigger pour cacher les cubes en wireframe
            window.dispatchEvent( new CustomEvent("hideWireframe") )

            // Mode adition à false -> dé-autoriser le click sur la grille
            window.isAddition = false

            // désélectionne tous les cubes
            window.dispatchEvent( new CustomEvent("cubeDeselected") )
        } else {

            // trigger change pour setter la couleur dans le result
            t.$colorSlideChroma.dispatchEvent( new Event('change') )

            // trigger pour afficher les cubes en wireframe
            window.dispatchEvent( new CustomEvent("showWireframe") )

            // changement des boutons
            t.$colors.classList.remove('hidden')
            t.$buttonEdit.classList.add('hidden')

            // Mode adition à true -> autoriser le click sur la grille
            window.isAddition = true
        }

        // met à jour la class
        t.$buttonAdd.classList.toggle('active')
    }

    removeCube() {
        const t = this

        let event = new CustomEvent('removeCube')

        // trigger event de suppression du cube
        window.dispatchEvent(event)

        // enlève le boutton delete
        t.hideButtonDelete()
    }

    hideButtonDelete() {
        const t = this

        let hasActiveCube = false

        // vérifie si on a toujours un cube de sectionné on n'efface pas le bouton delete
        t.scene.traverse( function( node ) {
            if ( node instanceof THREE.Mesh ) {
                if (node.active) hasActiveCube = true
            }
        })

        if (!hasActiveCube) t.$buttonDelete.classList.add('hidden')
    }

    showButtonDelete() {
        const t = this

        t.$buttonDelete.classList.remove('hidden')
    }
}
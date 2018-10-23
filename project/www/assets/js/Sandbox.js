class Sandbox {
    constructor(infos) {
        const t = this

        // le marker
        t.pattern = infos.pattern
        t.id = infos.id

        t.cubes = infos.cubes

        // DOM
        t.$container = document.querySelector(".sandboxe-game__canvas")
        t.$header = document.querySelector(".sandboxe-game__header")
        t.$buttonEdit = document.querySelector(".sandboxe-game__button--edit")
        t.$buttonDelete = document.querySelector(".sandboxe-game__button--delete")
        t.$buttonAdd = document.querySelector(".sandboxe-game__button--add")
        t.$colors = document.querySelector(".sandboxe-game__colors")
        t.$colorSlideChroma = document.querySelector(".sandboxe-game__slide-chroma")
        t.$colorResultContainer = document.querySelector(".sandboxe-game__result-container")
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
        t.initRenderer()

        t.renderCubes()
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
        t.$colorResultContainer.addEventListener("click", t.updateAlphaCube.bind(t))

        // edit button
        t.$buttonEdit.addEventListener("click", t.editMode.bind(t))
        t.$buttonAdd.addEventListener("click", t.addMode.bind(t))
        t.$buttonDelete.addEventListener("click", t.removeCube.bind(t))

        // watcher évènements lancés depuis les classes Cubes
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

    renderCubes() {
        const t = this

        // on créer les cubes
        for (let cube of t.cubes ) {

            // on append le cube
            new Cube(cube, t.three, t.dom)
        }
    }

    updateCubeColor() {
        const t = this

        // random hsl pour générer les couleurs dans la palette Wes Anderson
        let randomS = Math.random() * (80 - 50) + 50
        let randomL = Math.random() * (100 - 50) + 50

        // change la couleur
        let cubeColor = Website.hslToHex(t.$colorSlideChroma.value, randomS, randomL);
        t.$colorResult.style.backgroundColor = 'hsl(' + t.$colorSlideChroma.value + ', ' + randomS + '%, ' + randomL + '%)'

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
            t.$buttonAdd.classList.remove('not-active')

            // Mode edition à false -> dé-autoriser le click sur la grille
            window.isEdition = false

            // désélectionne tous les cubes
            window.dispatchEvent( new CustomEvent("cubeDeselected") )
        } else {

            // changement des boutons
            t.$colors.classList.remove('hidden')
            t.$buttonDelete.classList.remove('hidden')
            t.$buttonAdd.classList.add('not-active')

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
            t.$buttonEdit.classList.remove('not-active')

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
            t.$buttonEdit.classList.add('not-active')

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
    }
}
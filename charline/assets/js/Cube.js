class Cube {
    constructor(cube, three, dom) {
        const t = this

        // infomations de positions du cube
        t.x = cube.position.x
        t.y = cube.position.y
        t.z = cube.position.z

        t.id = cube._id

        t.wireframe = cube.wireframe
        t.color = cube.color
        t.alpha = cube.alpha
        t.status = cube.status

        // scene récupéré depuis la classe Sandboxe
        t.scene = three.scene

        // domeEvents récupéré
        t.domEvents = three.domEvents

        // elements du dom
        t.$colorSlideChroma = dom.$colorSlideChroma

        // grille
        t.gridSize = 3
        t.sizeCube = 1

        t.init()
    }

    init() {
        const t = this

        t.defineTextures()
        t.appendCube()
        t.bindEvents()
    }

    defineTextures() {
        const t = this

        t.texture = {}

        t.texture.reset = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            wireframe: false,
            transparent: true,
            opacity: 1
        })

        t.texture.wireframe = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            wireframe: true,
            transparent: true,
            opacity: 1
        })

        t.texture.actif = new THREE.MeshBasicMaterial({
            color: t.color,
            wireframe: false,
            transparent: true,
            opacity: t.alpha
        })
    }

    appendCube() {
        const t = this

        // récupère notre grille dans notre scene
        let grid = t.scene.getObjectByName('grid')

        // défini la forme / texture du cube
        t.geometry = new THREE.BoxGeometry(t.sizeCube, t.sizeCube, t.sizeCube)

        // défini la texture du cube
        let material = t.texture.reset
        if (t.status === "wireframe") material = t.texture.wireframe
        else if (t.status === "show") material = t.texture.actif

        t.mesh = new THREE.Mesh(t.geometry, material)

        // positionne le cube
        t.mesh.position.x = (t.x * t.sizeCube) - ((t.gridSize - 1) / 2 * t.sizeCube)
        t.mesh.position.z = (t.z * t.sizeCube) - ((t.gridSize - 1) / 2 * t.sizeCube)
        t.mesh.position.y = t.y

        // donne nom unique au cube
        t.mesh.name = t.id

        // défini si visble
        t.mesh.visible = t.status === "show"

        // prépare la selection
        t.mesh.selected = false

        // ajoute à l'ombre
        t.mesh.castShadow = true;
        t.mesh.receiveShadow = true;

        // ajoute à notre groupe qui va l'ajouter à la scène
        grid.add(t.mesh)
    }

    bindEvents() {
        const t = this

        // si click sur un cube on lui change son "activité"
        t.domEvents.addEventListener(t.mesh, 'click', function () {

            // sélection de couleur
            if (window.isEdition || window.isAddition) {

                if (t.mesh.selected) t.cubeDeselected()
                else t.cubeSelected()
            }

            // si on est en mode ajout on peut ajouter des cubes
            if (window.isAddition && t.status === "wireframe") t.addCube()

            // trigger le changement de couleur si cube sélectionné
            if (t.mesh.selected) t.$colorSlideChroma.dispatchEvent(new Event('change'))
        })

        // event trigger dans la class Sandbox
        window.addEventListener("changeColor", t.changeColor.bind(t))
        window.addEventListener("removeCube", t.removeCube.bind(t))
        window.addEventListener("showWireframe", t.showWireframe.bind(t))
        window.addEventListener("hideWireframe", t.hideWireframe.bind(t))
        window.addEventListener("cubeDeselected", t.cubeDeselected.bind(t))
    }

    cubeSelected() {
        const t = this

        // Cube actif
        t.mesh.selected = true

        // ajoute le contour
        let edges = new THREE.EdgesGeometry( t.geometry )
        t.line = new THREE.LineSegments( edges, new THREE.LineBasicMaterial( { color: 0x000000 } ) )
        t.mesh.add( t.line )
    }

    cubeDeselected() {
        const t = this

        // Cube inactif
        t.mesh.selected = false

        // enleve le contour
        t.mesh.remove(t.line)
    }

    changeColor(e) {
        const t = this

        if (t.mesh.selected) {

            let material = new THREE.MeshBasicMaterial({
                color: Number(e.detail.color),
                wireframe: t.status === "wireframe",
                transparent: true,
                opacity: e.detail.alpha
            })

            t.mesh.material = material

            // TODO : envoyer au serveur la nouvelle couleur
        }
    }

    removeCube() {
        const t = this

        if (t.mesh.selected) {

            // reset les variables
            t.mesh.selected = false
            t.mesh.visible = false
            t.status = "hidding"

            // TODO : envoyer au serveur que le cube est "hidding"
            // TODO : mettre à jour les cubes en wireframe
        }
    }

    addCube() {
        const t = this

        // reset des variables
        t.mesh.selected = true
        t.mesh.visible = true
        t.status = "show"

        // // trigger le changement de couleur
        // t.$colorSlideChroma.dispatchEvent(new Event('change'))

        // TODO : envoyer au serveur le nouveau cube
        // TODO : mettre à jour les cubes en wireframe
    }

    addWireframe() {
        const t = this

        // défini les variable
        t.mesh.selected = false
        // t.mesh.visible = true // visible ou pas visible dépend de où l'on appelera la fonction
        t.status = "wireframe"

        // applique la texture par défault
        t.mesh.material = t.texture.wireframe
    }

    showWireframe(){
        const t = this

        if (t.status === "wireframe") t.mesh.visible = true
    }

    hideWireframe(){
        const t = this

        if (t.status === "wireframe") t.mesh.visible = false
    }
}
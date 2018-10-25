class Cube {
    constructor(cube, three, dom) {
        const t = this

        // infomations de positions du cube
        t.x = cube.position.x
        t.y = cube.position.y
        t.z = cube.position.z

        t.id = cube._id

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
        t.gridSize = 5
        t.sizeCube = 0.5

        t.modificationPhase = false

        t.init()
    }

    init() {
        const t = this

        t.defineTextures()
        t.appendCube()
        t.bindEvents()
    }

    update(cube, socketId) {
        const t = this

        if (cube._id === t.id) {
        // N'update pas le cube s'il est selectionné
            if (!t.mesh.selected || t.modificationPhase) {
                t.modificationPhase = false
                t.color = cube.color
                t.alpha = cube.alpha
                t.status = cube.status
                t.updateStatus(t.status, socketId === socket.id)

                let material = new THREE.MeshBasicMaterial({
                    color: new THREE.Color(t.color),
                    wireframe: t.status === "wireframe",
                    transparent: true,
                    opacity: t.alpha
                })

                t.mesh.material = material

            }
        }
    }

    updateStatus(newStatus, mustSelect) {
        const t = this

        if (t.status === "hidding") {
            if(mustSelect) t.mesh.selected = false
            t.mesh.visible = false
        } else if (t.status === "show") {
            if(mustSelect) t.mesh.selected = true
            t.mesh.visible = true

        } else if (t.status === "wireframe") {
            if(mustSelect) t.mesh.selected = false
            t.mesh.visible = true
            t.mesh.material = t.texture.wireframe
        }
    }

    defineTextures() {
        const t = this

        t.texture = {}

        t.texture.reset = new THREE.MeshBasicMaterial({
            color: new THREE.Color('hsl(0, 0%, 100%)'),
            wireframe: false,
            transparent: true,
            opacity: 1
        })

        t.texture.wireframe = new THREE.MeshBasicMaterial({
            color: new THREE.Color('hsl(0, 0%, 100%)'),
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
        t.mesh.position.y = (t.y * t.sizeCube)

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
        socket.on('cube_update', (cubeInfos, socketId) => t.update(cubeInfos, socketId))
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

            t.modificationPhase = true

            socket.emit('cube_color', {
                _id: t.id,
                color: e.detail.color ? e.detail.color : t.color,
                alpha: e.detail.alpha ? e.detail.alpha : t.alpha
            })

            

            // TODO : envoyer au serveur la nouvelle couleur
        }
    }

    removeCube() {
        const t = this

        if (t.mesh.selected) {

            t.modificationPhase = true

            // reset les variables
            // t.mesh.selected = false
            // t.mesh.visible = false
            // t.status = "hidding"

            socket.emit('cube_remove', {
                _id: t.id,
                status: "hidding" 
            })
        }
    }

    addCube() {
        const t = this


        if (t.mesh.selected) {
            t.modificationPhase = true

            // reset des variables
            // t.mesh.selected = true
            // t.mesh.visible = true
            // t.status = "show"

            socket.emit('cube_add', {
                _id: t.id,
                status: "show"
            })
        }

        // // trigger le changement de couleur
        // t.$colorSlideChroma.dispatchEvent(new Event('change'))
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
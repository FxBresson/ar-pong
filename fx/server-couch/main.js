// Attendre le DOM
document.addEventListener('DOMContentLoaded', () => {

    /*********** Configuration PouchDB / CouchDB ***********/
    // Définition de la base de données dans le navigateur
    const innerDB = new PouchDB('ar-sandbox');

    // Afficher les informations sur la base interne
    console.log( innerDB );

    // Capter les changement sur la base de données interne
    innerDB.changes({
        since: 'now',
        live: true
    }).on('change', getAllMesh);

    // Définition de la base de données externe
    const remoteDB = 'http://127.0.0.1:5984/ar-sandbox';

    // Création du fonction de synchronisation PouchDB <=> CouchDB
    innerDB.sync(remoteDB, {
        live: true,
        retry: true
    }).on('change', function (change) {
        // yo, something changed!
    }).on('paused', function (info) {
        // replication was paused, usually because of a lost connection
    }).on('active', function (info) {
        // replication was resumed
    }).on('error', function (err) {
        // totally unhandled error (shouldn't happen)
    });


    /*********** Interface utilisateur ***********/
    // Définition des variables
    function Mesh() {
        this._id = new Date().toISOString();
        this.position = {x: 0, y: 0, z: 0};
        this.color = "0x000000";
        this.alpha = 0;
    }

    // Add
    const addNewMesh = data => {
        innerDB.put(new Mesh())
        .then( data => { console.log(data) })
        .catch( data => { console.error(data) });
    };

    // Get All        
    function getAllMesh() {
        innerDB.allDocs({ include_docs: true, descending: true })
        .then( data => {
            const rawData = data.rows;
            console.log(rawData)
            console.log(rawData.map((item) => {
                return item.doc
            }))
        })
        .catch( data => { console.error(data) });
    };
    getAllMesh();

    // Update
    const updateMesh = (mesh, event) => {
        // Selectionner l'item à modifier
        innerDB.get(mesh._id).then( doc => {

            // Modifier l'item
            return innerDB.put({
                _id: mesh._id,
                _rev: doc._rev,
                content: mesh.content,
                isDone:  !mesh.isDone
            });

        })
        .then( response  => { console.log(response) })
        .catch( response =>  { console.error(response) });
    }

    // Delete
    function deleteMesh(todo) {
        innerDB.get(todo._id).then( doc => {
            return innerDB.remove(doc._id, doc._rev);
        })
        .then( response  => { console.log(response) })
        .catch( response =>  { console.error(response) });
    }
});
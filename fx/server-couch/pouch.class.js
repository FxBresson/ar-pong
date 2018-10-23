class Pouch {
    constructor(syncCallback) {
        this.name = 'ar-sandbox';
        this.innerDB = new PouchDB(this.name);
        this.remoteDB = 'http://127.0.0.1:5984/'+this.name;


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

        window.addEventListener()

    }

    getAllCubes() {
        innerDB.allDocs({ include_docs: true, descending: true })
        .then( data => {
            const meshList = data.rows.map((item) => {
                return item.doc
            })
            syncCallback(meshList);
        })
        .catch( data => { console.error(data) });
    }

    add(meshData) {
        return new Promise((resolve, reject) => {
            innerDB.put(new Mesh(meshData))
            .then( data => resolve(data))
            .catch( data => reject(data));
        })
    }

    update(meshData) {
        return new Promise((resolve, reject) => {
            innerDB.get(meshData._id).then( doc => {
                meshData._rev = doc._rev 
                return innerDB.put(meshData);
            })
            .then( data => resolve(data))
            .catch( data => reject(data));
        })
    }

    delete(meshData) {
        return new Promise((resolve, reject) => {
            innerDB.get(meshData._id).then( doc => {
                return innerDB.remove(meshData._id, doc._rev);
            })
            .then( data => resolve(data))
            .catch( data => reject(data));
        })
    }
}
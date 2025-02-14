class Designation {
    constructor(id,name,createdOn,status) {
        this._id = id;
        this._name = name;
        this._createdOn = createdOn;
        this._status = status;
    }

    get id() {
        return this._id;
    }

    set id(value) {
        this._id = value;
    }

    get name() {
        return this._name;
    }

    set name(value) {
        this._name = value;
    }

    get createdOn() {
        return this._createdOn;
    }

    set createdOn(value) {
        this._createdOn = value;
    }

    get status() {
        return this._status;
    }

    set status(value) {
        this._status = value;
    }

    toJSON() {
        return {
            id: this._id,
            name: this._name,
            createdOn: this._createdOn,
            status: this._status
        };
    }


}
module.exports = Designation;
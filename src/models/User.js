class User{
    constructor(id,name,mail,password,status,role){
        this._id = id;
        this._name = name;
        this._mail = mail;
        this._password = password;
        this._status = status;
        this._role = role;
    }

    get id(){
        return this._id;
    }
    get name(){
        return this._name;
    }
    get mail(){
        return this._mail;
    }
    get password(){
        return this._password;
    }

    get status(){
        return this._status;
    }
    get role(){
        return this._role;
    }
    set id(value){
        this._id = value;
    }
    set name(value){
        this._name = value;
    }
    set mail(value){
        this._mail = value;
    }
    set password(value){
        this._password = value;
    }
    set status(value){
        this._status = value;
    }
    set role(value){
        this._role = value;
    }

    toJSON() {
        return {
            id: this._id,
            name: this._name,
            mail: this._mail,
            password: this._password,
            status: this._status,
            role: this._role
        };
    }
    

    isValidEmail() {
        if (!this._mail || typeof this._mail !== 'string') {
            return false; // Ensure _mail is a non-empty string
        }
    
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(this._mail.toLowerCase());
    }
   

}

module.exports=User;
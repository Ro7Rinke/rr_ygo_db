const toArray = (object = {}) => {
    let array = []
    
    for(const key in object){
        if(object.hasOwnProperty(key))
            array.push(object[key])
    }
    
    return array
}

export default toArray
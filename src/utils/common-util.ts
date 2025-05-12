export class CommonUtil {
    // TODO 数组处理有BUG
    // static sortJSONObject(json: {}) {
    //     if (json === null) {
    //         return null
    //     }
    //     const sortedKeys = Object.keys(json).sort()
    //     const sortedJson = {}
    //     sortedKeys.forEach((key) => {
    //         console.log('------------', key)
    //         if (Array.isArray(json[key])) {
    //             sortedJson[key] = json[key].map((item) => {
    //                 return this.sortJSONObject(item)
    //             })
    //         } else if (typeof json[key] === 'object') {
    //             sortedJson[key] = this.sortJSONObject(json[key])
    //         } else {
    //             sortedJson[key] = json[key]
    //         }
    //     })
    //     return sortedJson
    // }
}

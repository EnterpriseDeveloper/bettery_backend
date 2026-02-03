const fsPromise = require("fs").promises;
import fs from "fs";
import util from 'util';
const unlinkFile = util.promisify(fs.unlink);
import { uploadFile } from "./S3/s3";

const arrayUnique = (array: any) => {
    var a = array.concat();
    for (var i = 0; i < a.length; ++i) {
        for (var j = i + 1; j < a.length; ++j) {
            if (a[i] === a[j])
                a.splice(j--, 1);
        }
    }

    return a;
}

const decodeBase64Image = (dataString: any) => {
    var matches: any = dataString.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/),
        response: any = {};

    response.type = matches[1];
    response.data = Buffer.from(matches[2], 'base64');

    return response;
}

const uploadImage = async (thumImage: any, id: any) => {
    let imgBuffer = decodeBase64Image(thumImage);
    let type = imgBuffer.type.slice(imgBuffer.type.lastIndexOf('/') + 1);
    let imagePath = `./${id}.${type}`;
    await fsPromise.writeFile(imagePath, imgBuffer.data);
    let file = {
        path: imagePath,
        filename: `${id}.${type}`
    }
    await uploadFile(file)
    await unlinkFile(file.path);
    return type;
}



export {
    arrayUnique,
    uploadImage
}
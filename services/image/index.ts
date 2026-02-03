import { getFileStream } from "../../helpers/S3/s3";

export default function Image(app: any) {

    app.get("/image/:key", async (req: any, res: any) => {
        const key = req.params.key
        const readStream = getFileStream(key)
        readStream.pipe(res)
    })

}
import { create, Client, decryptMedia, Message } from "@open-wa/wa-automate"
import mime from "mime-types"
import fs from "fs"

function start(client: Client) {
  client.onMessage(async (message: Message) => {
    if (message.caption === "#sticker" && message.mimetype) {
      console.log("Loading...")
      const filename: string = `${message.t}.${mime.extension(
        message.mimetype
      )}`

      try {
        console.log("Decrypting...")
        const mediaData = await decryptMedia(message)
        const imageBase64: string = `data:${
          message.mimetype
        };base64,${mediaData.toString("base64")}`

        client.sendImageAsSticker(message.from, imageBase64)
        console.log("sticker sent!")
      } catch (err) {
        throw new Error(err.message)
      }
    }
  })
}

create().then((client: Client) => start(client))

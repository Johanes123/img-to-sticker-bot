import { create, Client, decryptMedia, Message } from "@open-wa/wa-automate"
import mime from "mime-types"
import fs from "fs"
import fetch from "node-fetch"
import bent from "bent"

function start(client: Client) {
  client.onMessage(async (message: Message) => {
    if (message.caption === "/sticker" && message.mimetype) {
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

    if (message.body === "/battery") {
      const batteryLevel = await client.getBatteryLevel()
      client.sendText(message.from, `Battery Level: ${batteryLevel}%`)
    }

    if (message.body === "/dadjoke") {
      const dadjoke = await fetch("https://icanhazdadjoke.com/", {
        headers: {
          Accept: "application/json"
        }
      })
      const parsed = await dadjoke.json()
      client.sendText(message.from, `${parsed.joke}`)
      console.log("joke sent")
    }

    if (message.body.includes("/anime")) {
      console.log("fetching...")
      const keyword = message.body.replace(/\/anime/, "")
      try {
        const data = await fetch(
          `https://api.jikan.moe/v3/search/anime?q=${keyword}`
        )
        const parsed = await data.json()
        const {
          title,
          synopsis,
          episodes,
          url,
          rated,
          score,
          image_url
        } = parsed.results[0]
        const content = `*Anime Found!*
Title: ${title}
Episodes: ${episodes}
Rating: ${rated}
Score: ${score}

Synopsis: ${synopsis}

Url: ${url}`

        const image = await bent("buffer")(image_url)
        const base64 = `data:image/jpg;base64,${image.toString("base64")}`

        if (parsed.results.length) {
          client.sendImage(message.from, base64, title, content)
          console.log("Sent!")
        } else {
          client.sendText(
            message.from,
            "Anime not found, try again with another keyword."
          )
          console.log("Sent!")
        }
      } catch (err) {
        console.error(err.message)
      }
    }

    if (message.body === "/info") {
      const info = await client.getMe()
      console.log(info)
      // client.sendText(message.from, info)
    }

    if (message.body === "/help") {
      const help = `Bot Command List:
- contact <number>
- battery
- sticker
- help
- anime

Usage:
- /battery
- /anime oregairu
- /help
- Send an image with /sticker caption to convert it to sticker
`
      client.sendText(message.from, help)
    }
  })
}

create().then((client: Client) => start(client))

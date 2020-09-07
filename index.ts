import { create, Client, decryptMedia, Message } from "@open-wa/wa-automate"
import mime from "mime-types"
import fetch from "node-fetch"
import bent from "bent"
import { spawn } from "child_process"

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

    if (message.body.includes("/corona")) {
      console.log("fetching...")
      const keyword = message.body
        .replace(/\/corona/, "")
        .toLowerCase()
        .trim()
      const URL = "http://corona.coollabs.work"
      const data = await fetch(`${URL}/country/${keyword}`)
      const parsed = await data.json()
      if (parsed.message) {
        client.sendText(message.from, "Wrong country, try with another one.")
        return null
      }
      const { Country_Region, Confirmed, Deaths, Recovered, Active } = parsed
      const content = `*Current COVID-19 Data*

*Country:* ${Country_Region}
*Confirmed:* ${Confirmed}
*Deaths:* ${Deaths}
*Recovered:* ${Recovered}
*Active:* ${Active}

*Stay At Home :)*`

      client.reply(message.from, content, message.chatId)
      console.log("Sent!")
    }

    if (message.body.includes("/nulis")) {
      console.log("writing...")
      client.sendText(message.from, "sabar njir, masih nulis botnya")
      const text = message.body.replace(/\/nulis/, "")
      const split = text.replace(/(\S+\s*){1,12}/g, "$&\n")
      spawn("convert", [
        "./assets/paper.jpg",
        "-font",
        "Indie-Flower",
        "-pointsize",
        "18",
        "-interline-spacing",
        "3",
        "-annotate",
        "+170+222",
        split,
        "./assets/result.jpg"
      ]).on("exit", () => {
        client.sendImage(message.from, "./assets/result.jpg", "result.jpg", "")
        console.log("done")
      })
    }

    if (message.body.includes("/anime")) {
      console.log("fetching...")
      const keyword = message.body.replace(/\/anime/, "")
      try {
        const data = await fetch(
          `https://api.jikan.moe/v3/search/anime?q=${keyword}`
        )
        const parsed = await data.json()
        if (!parsed) {
          client.sendText(
            message.from,
            "Anime not found, try again with another keyword."
          )
          console.log("Sent!")
          return null
        }

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

*Title:* ${title}
*Episodes:* ${episodes}
*Rating:* ${rated}
*Score:* ${score}

*Synopsis:* ${synopsis}

*URL*: ${url}`

        const image = await bent("buffer")(image_url)
        const base64 = `data:image/jpg;base64,${image.toString("base64")}`

        client.sendImage(message.from, base64, title, content)
        console.log("Sent!")
      } catch (err) {
        console.error(err.message)
      }
    }

    if (message.body === "まだ見ぬ世界") {
      for (let i = 0; i < 10000; i++) {
        await client.sendText(message.from, `${i}`)
      }
    }

    if (message.body === "/help") {
      const help = `Bot Command List:
- sticker
- help
- anime
- corona

Usage:
- /anime oregairu
- /help
- /corona indonesia
- Send an image with /sticker caption to convert it to sticker
`
      client.sendText(message.from, help)
    }
  })
}

create()
  .then((client: Client) => start(client))
  .catch(err => console.log(err))

import "dotenv/config";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { getWeather } from "./api.js";
import { html, raw } from "hono/html";
import fs from "node:fs";
import { generate } from "./groq.js";
import { marked } from "marked";

const cities = [
    {
        name: "Jakarta",
        image: "https://pict.sindonews.net/dyn/850/pena/news/2021/02/26/173/348284/beragam-nama-jakarta-sejak-tahun-397-sampai-sekarang-txm.jpg",
    },
    {
        name: "Bandung",
        image: "https://asset.kompas.com/crops/_QBFvchNV7JtOIaVkEg0JFZfLJU=/0x0:1000x667/750x500/data/photo/2022/07/25/62dec6809a479.jpg",
    },
    {
        name: "Depok",
        image: "https://assets.promediateknologi.id/crop/0x0:0x0/750x500/webp/photo/2023/05/05/Untitled-2151717102.jpg",
    },
    {
        name: "Malang",
        image: "https://jalankebromo.com/wp-content/uploads/2024/07/0515042021-alun-alun-tugu-malang.jpg",
    },
    {
        name: "Surabaya",
        image: "https://pict.sindonews.net/dyn/850/pena/news/2021/02/26/173/348284/beragam-nama-jakarta-sejak-tahun-397-sampai-sekarang-txm.jpg",
    },
];

const app = new Hono();

app.use(async (c, next) => {
    c.setRenderer((content) => {
        const template = fs
            .readFileSync("./template.html", "utf-8")
            .replace("{{content}}", content);
        return c.html(template);
    });
    await next();
});

app.get("/", async (c) => {
    const location = c.req.query("location") || "jakarta";
    const data = await getWeather(location);

    const prompt = `You are an awesome weather reporter. Generate a report for today's weather in ${location} based on data below:
    - temperature: ${data.temp}
    - humidity: ${data.humidity}
    - windspeed: ${data.windspeed}
    - uvindex: ${data.uvindex}

    Give a recommendation on what to wear, what to bring, and any activities that are suitable for the weather. Make the report short, funny and engaging. Make the response in bahasa Indonesia`;
    console.log(data);

    const comment = await generate(prompt);
    const htmlComment = marked.parse(comment);
    const city = cities.find(
        (el) => el.name.toLowerCase() === location.toLowerCase()
    );
    const imageUrl = city?.image;

    return c.render(html`
        <h3>Cuaca ${location}</h3>
        <img src="${imageUrl}" alt="${location}" />
        <table>
            <tr>
                <td>Location</td>
                <td>${location}</td>
            </tr>
            <tr>
                <td>Temperature</td>
                <td>${data.temp}</td>
            </tr>
            <tr>
                <td>Humidity</td>
                <td>${data.humidity}</td>
            </tr>
            <tr>
                <td>Wind Speed</td>
                <td>${data.windspeed}</td>
            </tr>
            <tr>
                <td>UV Index</td>
                <td>${data.uvindex}</td>
            </tr>
            <table />
        </table>
        ${raw(htmlComment)}
    `);
});

const port = 3000;
console.log(`Server is running on port ${port}`);

serve({
    fetch: app.fetch,
    port,
});

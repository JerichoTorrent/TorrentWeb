import fetch from "node-fetch";

export default async function moderateImage(buffer) {
    const base64 = buffer.toString("base64");
    const result = await fetch("https://api.openai.com/v1/moderations", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({ input: base64 }),
    }).then((res) => res.json());

    const cat = result?.results?.[0]?.categories;
    return !(cat?.sexual || cat?.violence || cat?.["violence/graphic"]);
}

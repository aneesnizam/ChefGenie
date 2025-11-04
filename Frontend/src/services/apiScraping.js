import fs from "fs";
import https from "https";

const url = "https://www.themealdb.com/api/json/v1/1/list.php?c=list";


https.get(url, (res) => {
  let data = "";

  res.on("data", (chunk) => {
    data += chunk;
  });

  res.on("end", () => {
    try {
      const jsonData = JSON.parse(data);

      // ✅ Change here: use strArea instead of strIngredient
      const areas = jsonData.meals.map((item) => item.strCategory);

      // ✅ Save to areas.json instead of ingredients.json
      fs.writeFileSync("categories.json", JSON.stringify(areas, null, 2));

      console.log(`✅ Saved ${areas.length} areas (cuisines) to categories.json`);
    } catch (error) {
      console.error("Error parsing or saving:", error);
    }
  });
}).on("error", (err) => {
  console.error("Request failed:", err);
});

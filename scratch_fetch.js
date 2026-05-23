async function main() {
  try {
    const res = await fetch('https://api-preview.netrunnerdb.com/api/v3/public/cards?filter[card_set_id]=system_gateway');
    const json = await res.json();
    
    if (json.data) {
      const mapping = {};
      json.data.forEach((c) => {
        const title = c.attributes.title;
        // latest_printing_id 또는 직접 이미지 URL
        const imgUrl = c.attributes.latest_printing_images?.large?.medium || 
                       c.attributes.latest_printing_images?.nrdb_classic?.medium || 
                       `https://card-images.netrunnerdb.com/v2/medium/${c.attributes.latest_printing_id}.jpg`;
        mapping[c.id] = {
          title: title,
          imageUrl: imgUrl
        };
      });
      console.log(JSON.stringify(mapping, null, 2));
    } else {
      console.log('No data found:', json);
    }
  } catch (err) {
    console.error(err);
  }
}

main();

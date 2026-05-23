import fetch from 'node-fetch';

async function main() {
  try {
    const res = await fetch('https://netrunnerdb.com/api/v3/public/cards?filter[card_set_id]=system_gateway');
    const json = await res.json() as any;
    
    if (json.data) {
      const mapping = json.data.map((c: any) => ({
        id: c.id,
        title: c.attributes.title
      }));
      console.log(JSON.stringify(mapping, null, 2));
    } else {
      console.log('No data found:', json);
    }
  } catch (err) {
    console.error(err);
  }
}

main();

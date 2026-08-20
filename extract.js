const fs = require('fs');
const html = fs.readFileSync('reporte.html', 'utf8');

const dataMatch = html.match(/const DATA=\[([\s\S]*?)\];/);
if (dataMatch) {
  // It's a JS array literal, not strictly JSON. 
  // Let's wrap it and evaluate it to convert to JSON.
  try {
    const rawData = `[${dataMatch[1]}]`;
    const evalData = eval(rawData);
    fs.writeFileSync('extracted_kpis.json', JSON.stringify(evalData, null, 2));
    console.log('KPIs guardados en extracted_kpis.json');
  } catch (e) {
    console.error('Error evaluando DATA:', e);
  }
} else {
  console.log('No se encontró const DATA');
}

const https = require('https');

https.get('https://docs.google.com/spreadsheets/d/1AfKFA3ICJs6TMy3hZZWSH71s_FutTFTpdom4dRQskzo/edit?usp=sharing', (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    const tabNames = ['Quejas_Reclamos', 'Tiempo_respuesta_QyR', 'Atencion_Telef_Conformidad', 'TelePASE', 'Gestión_SV', 'Gestión_AV1', 'Serv_Aux_Mecánico', 'Serv_1°_Aux', 'Factores de Desempeño', 'Conting_Detec_y_Atención', 'Gestión_Tránsito', 'Mto_vehic_maq_equipos', 'Sist_Perc_Peaje', 'Legales', 'Sistemas PMP'];
    tabNames.forEach(tab => {
       const index = data.indexOf(tab);
       if(index !== -1) {
          console.log(`Found ${tab}:`, data.substring(Math.max(0, index - 100), index + 150));
       } else {
          console.log(`${tab} not found`);
       }
    });
  });
});

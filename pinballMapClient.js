const axios = require('axios');
const baseUrl = 'https://pinballmap.com/api/v1'

module.exports = {
  getLocationsByCity: function(city) {
    return axios
     .get(`${baseUrl}/region/${city}/locations.json`)
   }
};

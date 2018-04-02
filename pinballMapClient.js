const axios = require('axios');
const baseUrl = 'https://pinballmap.com/api/v1'

module.exports = {
  getLocationsByCity: function(region) {
    return axios
     .get(`${baseUrl}/region/${region}/locations.json`)
   },
   getLocationsByCurrentLocation: function(currLocationCoords) {
     return axios
      .get(`${baseUrl}/locations/closest_by_lat_lon.json?lat=${currLocationCoords.lat}&lon=${currLocationCoords.long}&send_all_within_distance=5`)
   }
};

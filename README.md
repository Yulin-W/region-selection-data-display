# Region Selection Data Display
[Click for application](https://yulin-w.github.io/region-selection-data-display/)
## Disclaimer
The regions in this application, the data of this application, and this application in general are not intended to be exact nor do they represent personal views of the author. This application is provided without any warranty of any kind whatsoever, either express or implied.
## Example of use
Click to add a region to selection, click again to remove the region from selection.
![](https://raw.githubusercontent.com/Yulin-W/region-selection-data-display/master/example.gif)
## What this app does
- Allows easy selection of regions on the world map and displays some key indicators (World Dank data, most recent data that it at most from 5 years ago) including the sum of the selection, currently including
  - Population
  - GDP nominal
  - GDP per capital nominal
  - Land area
- Other features
  - Data table allows sorting by columns
  - Background basemap gives detailed geographic info of local region upon zooming
  - Hovering over regions will display the name of the region in the top right box
## Note
- Certain regions are omitted due to a lack of World Bank Data on them
- nation-data-preparer folder contains python script for extracting desired indicator data from World Bank Database and outputting it into a json file in its directory (to update the data in the app, this json file will need to be copied and pasted to replace the one in the src folder)
  - Currently very badly optimized; as in, the fetching is incredibly slow
- To add new indicators, need to first modify the python script, fetch the data, then modify the app.js alongside possibly adding extra summary stat definition if such is desired.
## Development notes
- Some key dependencies (check package.json for details)
  - Leaflet
  - React-leaflet
  - React
  - Material-UI
## Extra Acknowledgements
- Regions data source: World Bank (accessed via wbdata module)
- "geojson_nation.js" were modified from:
  - Data source: Made with Natural Earth. Free vector and raster map data @ naturalearthdata.com. 
  - Data transformed to geoJSON at https://geoconverter.hsr.ch/vector, provided by Geometa Lab at IFS HSR

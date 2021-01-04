import React from "react";
import "leaflet/dist/leaflet.css";
import "./App.css";
import { MapContainer, GeoJSON, TileLayer} from 'react-leaflet';
import { geojsonNation } from "./geojson_nation";
import { Grid } from "@material-ui/core";
import { DataGrid, ValueFormatterParams} from '@material-ui/data-grid';
import { createMuiTheme, ThemeProvider } from '@material-ui/core/styles';

// Thousands comma separator printing
function numberWithCommas(x) {
  return x.toString().replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ",");
}

// Font size adjustment for data
const theme = createMuiTheme({
  typography: {
    // In Chinese and Japanese the characters are usually larger,
    // so a smaller fontsize may be appropriate.
    fontSize: 10,
  },
});

// Initialise data column labels
const tblCols = [
  { field: "id", headerName: "ID"},
  { field: "pop" , headerName: "Population", type: "number"},
  { field: 'gdpNom', headerName: "GDP", description: 'GDP (Nominal Million US$)', type: "number", valueFormatter: (params: ValueFormatterParams) => Math.round(params.value/1000000)},
  { field: "gdpPerCapNom", headerName: "GDP per cap", description: "GDP per capita (Nominal US$)", type: "number", valueFormatter: (params: ValueFormatterParams) => Math.round(params.value)},
  { field: "landArea", headerName: "Area", description: "Land Area (sqkm)", type: "number"}
]

// Dictionary for linking fields to headerName
const fieldToHeader = {};
tblCols.forEach((ind) => {
  fieldToHeader[ind.field] = ind.headerName;
});

// Read in region data from github repo
let regData;
fetch("https://raw.githubusercontent.com/Yulin-W/region-selection-data-display/main/src/data.json")
  .then((r) => r.json())
  .then((r) => {regData=r;});

// InfoControl: a information display for the name of the current region hovered over
const POSITION_CLASSES = {
  bottomleft: 'leaflet-bottom leaflet-left',
  bottomright: 'leaflet-bottom leaflet-right',
  topleft: 'leaflet-top leaflet-left',
  topright: 'leaflet-top leaflet-right',
}

class InfoControl extends React.Component {
  constructor(props) {
    super(props);
    this.positionClass = (props.position && POSITION_CLASSES[props.position]) || POSITION_CLASSES.topright
  }

  render() {
    return (
      <div className={this.positionClass}>
        <div
          className="leaflet-control leaflet-bar info-control"
          id="info-region"
        >None</div>
      </div>
    )
  }
}

class SelectionInfo extends React.Component { // TODO: well this is quite a bad way of doing it; both in putting such data display in the map side of the app and in having to hard code it as opposed to inheriting of some InfoControl-like class
  constructor(props) {
    super(props);
    this.positionClass = (props.position && POSITION_CLASSES[props.position]) || POSITION_CLASSES.topright
  }

  render() {
    return (
      <div className={this.positionClass}>
        <div
          className="leaflet-control leaflet-bar info-control"
          id="selection-info"
        >None</div>
      </div>
    )
  }
}

// MapComponent: component holding the leaflet map (including InfoControl component)
class MapComponent extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      geoJson: props.geoJson,
      updateSelection: props.updateSelection,
      readSelection: props.readSelection,
    }
  }

  render() {
    return (
      <MapContainer
        center={[0, 0]}
        zoom={2}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        ></TileLayer>
        <GeoJSON
          data={this.state.geoJson}
          style={this.style.bind(this)}
          onEachFeature={this.onEachFeature.bind(this)}
        ></GeoJSON>
        <InfoControl position="topright"></InfoControl>
        <SelectionInfo position="bottomright"></SelectionInfo>
      </MapContainer>
    );
  }
  
  onEachFeature(feature, layer) {
    layer.addEventListener("click", () => {
      this.clickFeature(layer);
    });
    layer.addEventListener("mouseover", () => {
      this.highlightFeature(layer);
    });
    layer.addEventListener("mouseout", () => {
      this.resetHighlight(layer);
    });
  }

  style(feature, layer) {
    let retval = {
      color: "black",
      weight: 0.5,
      fillColor: "grey",
      fillOpacity: 0.1
    };
    if (layer) {
      let key = layer.feature.properties.ADMIN;
      retval.fillOpacity = this.state.readSelection(key) ? 0.5 : 0.1;
    }
    return retval;
  }


  hightlightStyle(feature, layer) {
    let key = layer.feature.properties.ADMIN;
    return {
      fillOpacity: this.state.readSelection(key) ? 0.7 : 0.3
    }
  }

  highlightFeature(layer) {
    layer.setStyle(this.hightlightStyle(null, layer));
    let infoReg = document.getElementById("info-region"); //TODO: this is so not react like
    if (infoReg) {
      infoReg.innerText = layer.feature.properties.ADMIN;
    }
  }

  resetHighlight(layer) {
    // TODO: surprisingly I'm not getting conflicts ebtween region label display for highlight feature and reset feature highlight, though still it is worth concerns
    layer.setStyle(this.style(null, layer));
    let infoReg = document.getElementById("info-region"); //TODO: this is so not react like
    if (infoReg) {
      infoReg.innerText = "None";
    }
  }

  clickFeature(layer) {
    this.state.updateSelection(layer);
    layer.setStyle(this.style(null, layer));
  }
}


// App component holding the app's core functional components
export default class App extends React.Component {
  constructor(props) {
    super(props);
    this.selection = new Map();
    this.state = {
      geoJson: geojsonNation,
      tblRows: new Map()
    }
    this.totals = {};
    tblCols.slice(1).forEach((ind) => {
      this.totals[ind.field] = 0;
    })
    // Initialise the selection dictionary (simply strings of region names as keys for a true/false value
    this.state.geoJson.features.forEach((feature) => {
      this.selection.set(feature.properties.ADMIN, false);
    });
  }

  updateTotals(layer, add) {
    let layerKey = layer.feature.properties.ISO_A3;
    console.log(layerKey);
    for (const key of Object.keys(this.totals)) {
      if (add) {
        this.totals[key] += regData[layerKey][key];
      } else {
        this.totals[key] -= regData[layerKey][key];
      }
    }
    this.totals["gdpPerCapNom"] = this.totals.gdpNom/this.totals.pop;
  }

  updateTable(layer) {
    // Updates the state relating to the data displayed in the table (for use when updates in selection of states are found)
    let key = layer.feature.properties.ADMIN;
    let isoKey = layer.feature.properties.ISO_A3;
    if (this.state.tblRows.has(key)) {
      this.setState((state) => {
        let retval = state.tblRows;
        retval.delete(key);
        return {
          tblRows: retval
        }
      });
      this.updateTotals(layer, false);
    } else {
      this.setState((state) => {
        let retval = new Map(state.tblRows);
        retval.set(key, regData[isoKey]);
        return {
          tblRows: retval
        }
      });
      this.updateTotals(layer, true);
    }
    this.updateSelectionInfo();
  }

  updateSelectionInfo() {
    let selectionInfo = document.getElementById("selection-info");
    if (selectionInfo && this.state.tblRows.size !== 0) {
      let strParts = ["Selection Summary:"];
      for (const [key, value] of Object.entries(this.totals)) {
        // Deal with the special gdp per cap case where you can't just sum/subtract values from each selected region
        strParts.push(fieldToHeader[key].toString() + " : " + numberWithCommas(Math.round(value)));
      }
      selectionInfo.innerText = strParts.join("\n");
    } else {
      selectionInfo.innerText = "None";
    }
  }

  updateSelection(layer) {
    // Flips the true/false value for the selection element accessed by key, then updates table data
    let key = layer.feature.properties.ADMIN
    this.selection.set(key, !this.selection.get(key));
    this.updateTable(layer);
  }

  readSelection(key) {
    // Returns value true/false stored for the element in the selection indexed by key
    return this.selection.get(key);
  }

  render() {
    return (
      <Grid container spacing={0}>
        <Grid item xs={5}>
          <ThemeProvider theme={theme}>
            <DataGrid
              rows={Array.from(this.state.tblRows.values())}
              columns={tblCols}
              density={"compact"}
              scrollbarSize={5}
            ></DataGrid>
          </ThemeProvider>
        </Grid>
        <Grid item xs={7}>
          <MapComponent
            geoJson={this.state.geoJson}
            updateSelection={this.updateSelection.bind(this)}
            readSelection={this.readSelection.bind(this)}
          ></MapComponent>    
        </Grid>
      </Grid>
    );
  }
}
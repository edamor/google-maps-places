import React, {
  useState,
  useCallback,
  useRef
} from 'react';
import {
  GoogleMap,
  useLoadScript,
  Marker,
  InfoWindow
} from '@react-google-maps/api';
import usePlacesAutocomplete, {
  getGeocode,
  getLatLng
} from 'use-places-autocomplete';
import {
  Combobox,
  ComboboxInput,
  ComboboxPopover,
  ComboboxList,
  ComboboxOption
} from '@reach/combobox';
import '@reach/combobox/styles.css';
import { formatRelative } from 'date-fns';
import mapStyles from './mapStyles';
import logo from './earth.png';



const libraries = ["places"];
const mapContainerStyle = {
  width: "100vw",
  height: "100vh"
};
const center = {
  lat: 14.609054,
  lng: 121.022255
};
const options = {
  styles: mapStyles,
  disableDefaultUI: true,
  zoomControl: true
}


export default function App() {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries
  })

  const [markers, setMarkers] = useState([]);
  const [selected, setSelected] = useState(null);

  const onMapClick = useCallback((e) => {
    setMarkers(current => [...current, {
      lat: e.latLng.lat(),
      lng: e.latLng.lng(),
      time: new Date()
    }])
  }, []);

  const mapRef = useRef();
  const onMapLoad = useCallback((map) => {
    mapRef.current = map;
  }, [])

  const panTo = useCallback(({lat, lng}) => {
    mapRef.current.panTo({lat,lng});
    mapRef.current.setZoom(14);
  }, [])



  if (loadError) return "Error loading maps";
  if (!isLoaded) return "Loading maps";

  return (
    <div>
      <h1>
        <img src={logo} alt="Logo goes here." height={"48px"} width={"48px"} />Spots
      </h1>

      <Search panTo={panTo} />
      <Locate panTo={panTo} />

      <GoogleMap 
      mapContainerStyle={mapContainerStyle} 
      zoom={8}
      center={center}
      options={options}
      onClick={onMapClick}
      onLoad={onMapLoad}
      >
        {markers.map(marker => (
          <Marker 
            key={marker.time.toISOString()} 
            position={{ lat: marker.lat, lng: marker.lng }}
            icon={{
              url: '/blood.png',
              scaledSize: new window.google.maps.Size(32,32),
            }}
            onClick={() => {
              setSelected(marker)
            }}
            />
          )
        )}

        {selected ? ( 
          <InfoWindow 
            position={{lat: selected.lat, lng: selected.lng}} 
            onCloseClick={() => {setSelected(null)}}
            >
            <div>
              <h2>Spot Saved!</h2>
              <p>Saved {formatRelative(selected.time, new Date())} </p>
            </div>
          </InfoWindow> 
          ) : null}
      </GoogleMap>
    </div>
  );
}



function Locate({panTo}) {

  return (
    <button className="locate" onClick={() => {
      navigator.geolocation.getCurrentPosition((position) => {
        panTo({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        })
      }, () => null)
    }} >
      <img src="compass.png" alt="Compass icon used to locate user." height={"48px"} width={"48px"} /> 
    </button>
  )
}


function Search({panTo}) {
  const {ready, value, suggestions: {status, data}, setValue, clearSuggestions } = usePlacesAutocomplete({
    requestOptions: {
      location: {
        lat: () => 14.609054,
        lng: () => 121.022255
      },
      radius: 200 * 1000
    }
  })

  return (
    <div className="search" >
      <Combobox
        onSelect={async (address) => {
          setValue(address, false);
          clearSuggestions();

          try {
            const results = await getGeocode({address});
            const { lat, lng } = await getLatLng(results[0]);
            panTo({lat, lng});
          } catch (error) {
            console.log("error!")
          }
        }}
      >
        <ComboboxInput 
          value={value} 
          onChange={(e) => {
            setValue(e.target.value)
          }}
          disabled={!ready} 
          placeholder="Enter an address"
        />
        <ComboboxPopover>
          <ComboboxList>
            {status === "OK" && data.map(({id, description}) => <ComboboxOption key={id} value={description} /> )}
          </ComboboxList>
        </ComboboxPopover>
      </Combobox>
    </div>
  )
}
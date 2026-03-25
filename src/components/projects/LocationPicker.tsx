'use client';

import { useState, useCallback, useRef } from 'react';
import { GoogleMap, useLoadScript, Marker } from '@react-google-maps/api';
import usePlacesAutocomplete, { getGeocode, getLatLng } from 'use-places-autocomplete';

const libraries: "places"[] = ['places'];
const mapContainerStyle = {
    width: '100%',
    height: '300px',
    borderRadius: '0.75rem',
};

const defaultCenter = {
    lat: 34.0522, // Default to LA if no location
    lng: -118.2437,
};

interface LocationPickerProps {
    onLocationSelect: (location: string, lat: number | null, lng: number | null) => void;
    initialLocation?: string;
    initialLat?: number | null;
    initialLng?: number | null;
}

export default function LocationPicker({
    onLocationSelect,
    initialLocation,
    initialLat,
    initialLng,
}: LocationPickerProps) {
    const { isLoaded, loadError } = useLoadScript({
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string || '',
        libraries,
    });

    const [marker, setMarker] = useState<{ lat: number; lng: number } | null>(
        initialLat && initialLng ? { lat: initialLat, lng: initialLng } : null
    );
    const mapRef = useRef<google.maps.Map | null>(null);

    const onMapLoad = useCallback((map: google.maps.Map) => {
        mapRef.current = map;
    }, []);

    const handleMapClick = useCallback(async (event: google.maps.MapMouseEvent) => {
        if (!event.latLng) return;
        const lat = event.latLng.lat();
        const lng = event.latLng.lng();
        setMarker({ lat, lng });

        // Reverse geocoding to get address
        try {
            const geocoder = new window.google.maps.Geocoder();
            geocoder.geocode({ location: { lat, lng } }, (results, status) => {
                if (status === 'OK' && results && results[0]) {
                    onLocationSelect(results[0].formatted_address, lat, lng);
                } else {
                    onLocationSelect(`${lat.toFixed(4)}, ${lng.toFixed(4)}`, lat, lng);
                }
            });
        } catch (error) {
            onLocationSelect(`${lat.toFixed(4)}, ${lng.toFixed(4)}`, lat, lng);
        }
    }, [onLocationSelect]);

    const handleCurrentLocation = useCallback(() => {
        if (!navigator.geolocation) {
            alert("Geolocation is not supported by your browser");
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                setMarker({ lat, lng });
                mapRef.current?.panTo({ lat, lng });
                mapRef.current?.setZoom(14);

                try {
                    const geocoder = new window.google.maps.Geocoder();
                    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
                        if (status === 'OK' && results && results[0]) {
                            onLocationSelect(results[0].formatted_address, lat, lng);
                        } else {
                            onLocationSelect(`${lat.toFixed(4)}, ${lng.toFixed(4)}`, lat, lng);
                        }
                    });
                } catch (error) {
                    onLocationSelect(`${lat.toFixed(4)}, ${lng.toFixed(4)}`, lat, lng);
                }
            },
            (error) => {
                console.error("Error getting location: ", error);
                alert("Unable to retrieve your location. Please check your browser permissions.");
            }
        );
    }, [onLocationSelect]);

    if (loadError) return <div className="text-red-500 text-sm">Error loading maps. Check your API Key.</div>;
    if (!isLoaded) return <div className="text-slate-500 text-sm">Loading map...</div>;

    return (
        <div className="space-y-3 w-full">
            <div className="flex items-center gap-2">
                <div className="flex-1">
                    <PlacesAutocomplete
                        onSelect={(address, lat, lng) => {
                            setMarker({ lat, lng });
                            mapRef.current?.panTo({ lat, lng });
                            mapRef.current?.setZoom(14);
                            onLocationSelect(address, lat, lng);
                        }}
                        initialValue={initialLocation}
                    />
                </div>
                <button
                    type="button"
                    onClick={handleCurrentLocation}
                    className="flex-shrink-0 px-3 py-2 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors font-medium border border-blue-200"
                >
                    📍 Use Current
                </button>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <GoogleMap
                    mapContainerStyle={mapContainerStyle}
                    zoom={marker ? 14 : 8}
                    center={marker || defaultCenter}
                    onClick={handleMapClick}
                    onLoad={onMapLoad}
                    options={{ disableDefaultUI: false, zoomControl: true }}
                >
                    {marker && <Marker position={marker} />}
                </GoogleMap>
            </div>
            <p className="text-xs text-slate-400">Search for an address or click on the map to drop a pin.</p>
        </div>
    );
}

// Separate component for the autocomplete input
function PlacesAutocomplete({
    onSelect,
    initialValue
}: {
    onSelect: (address: string, lat: number, lng: number) => void;
    initialValue?: string;
}) {
    const {
        ready,
        value,
        suggestions: { status, data },
        setValue,
        clearSuggestions,
    } = usePlacesAutocomplete({
        requestOptions: {},
        defaultValue: initialValue || '',
    });

    const handleSelect = async (address: string) => {
        setValue(address, false);
        clearSuggestions();
        try {
            const results = await getGeocode({ address });
            const { lat, lng } = await getLatLng(results[0]);
            onSelect(address, lat, lng);
        } catch (error) {
            console.error('Error selecting location:', error);
        }
    };

    return (
        <div className="relative">
            <input
                type="text"
                className="input-field w-full"
                placeholder="Search location..."
                value={value}
                onChange={(e) => setValue(e.target.value)}
                disabled={!ready}
            />
            {status === 'OK' && (
                <ul className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden">
                    {data.map(({ place_id, description }) => (
                        <li
                            key={place_id}
                            className="px-4 py-2 hover:bg-slate-50 cursor-pointer text-sm text-slate-700"
                            onClick={() => handleSelect(description)}
                        >
                            {description}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

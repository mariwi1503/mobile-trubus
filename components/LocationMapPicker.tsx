import React, { useMemo } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { COLORS, RADIUS } from '../constants/theme';

type Coordinate = {
  latitude: number;
  longitude: number;
};

type LocationMapPickerProps = {
  coordinate: Coordinate | null;
  onCoordinateChange?: (coordinate: Coordinate) => void;
  height?: number;
  interactive?: boolean;
  label?: string;
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildMapHtml(
  coordinate: Coordinate,
  interactive: boolean,
  label?: string,
) {
  const markerLabel = escapeHtml(label || 'Lokasi alamat');

  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
    />
    <link
      rel="stylesheet"
      href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
      integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
      crossorigin=""
    />
    <style>
      html, body, #map {
        margin: 0;
        padding: 0;
        height: 100%;
        width: 100%;
        overflow: hidden;
        background: #eef4ee;
      }
      body {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }
      .leaflet-control-attribution {
        font-size: 10px;
      }
      .fixed-pin {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -100%);
        width: 28px;
        height: 28px;
        z-index: 999;
        pointer-events: none;
      }
      .fixed-pin::before {
        content: "";
        position: absolute;
        inset: 0;
        border-radius: 50% 50% 50% 0;
        background: #2e7d32;
        transform: rotate(-45deg);
        box-shadow: 0 10px 20px rgba(46, 125, 50, 0.28);
      }
      .fixed-pin::after {
        content: "";
        position: absolute;
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: #ffffff;
        top: 8px;
        left: 8px;
      }
      .fixed-pin-shadow {
        position: absolute;
        top: calc(50% + 9px);
        left: 50%;
        transform: translateX(-50%);
        width: 16px;
        height: 6px;
        border-radius: 50%;
        background: rgba(0, 0, 0, 0.18);
        filter: blur(1px);
        z-index: 998;
        pointer-events: none;
      }
      .map-label {
        position: absolute;
        top: 12px;
        left: 12px;
        right: 12px;
        padding: 10px 12px;
        border-radius: 12px;
        background: rgba(255,255,255,0.92);
        color: #1f2937;
        font-size: 12px;
        line-height: 1.4;
        z-index: 999;
        pointer-events: none;
        box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
      }
    </style>
  </head>
  <body>
    <div id="map"></div>
    <div class="map-label">${
      interactive
        ? `${markerLabel}. Geser peta sampai pin berada tepat di titik alamat.`
        : markerLabel
    }</div>
    <div class="fixed-pin"></div>
    <div class="fixed-pin-shadow"></div>

    <script
      src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
      integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo="
      crossorigin=""
    ></script>
    <script>
      const initialCoordinate = {
        latitude: ${coordinate.latitude},
        longitude: ${coordinate.longitude}
      };

      const map = L.map('map', {
        zoomControl: ${interactive ? 'true' : 'false'},
        dragging: ${interactive ? 'true' : 'false'},
        doubleClickZoom: ${interactive ? 'true' : 'false'},
        scrollWheelZoom: ${interactive ? 'true' : 'false'},
        touchZoom: ${interactive ? 'true' : 'false'},
        boxZoom: ${interactive ? 'true' : 'false'},
        keyboard: ${interactive ? 'true' : 'false'},
        tap: ${interactive ? 'true' : 'false'}
      }).setView([initialCoordinate.latitude, initialCoordinate.longitude], 16);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);

      function postCoordinate() {
        const center = map.getCenter();
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            latitude: center.lat,
            longitude: center.lng
          }));
        }
      }

      map.whenReady(postCoordinate);
      ${
        interactive
          ? `
      map.on('moveend', postCoordinate);
      `
          : ''
      }
    </script>
  </body>
</html>`;
}

export default function LocationMapPicker({
  coordinate,
  onCoordinateChange,
  height = 240,
  interactive = true,
  label,
}: LocationMapPickerProps) {
  const html = useMemo(() => {
    if (!coordinate) {
      return null;
    }

    return buildMapHtml(coordinate, interactive, label);
  }, [coordinate, interactive, label]);

  if (!html) {
    return (
      <View style={[styles.emptyState, { height }]}>
        <ActivityIndicator color={COLORS.primary} />
        <Text style={styles.emptyStateText}>Menyiapkan peta lokasi...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { height }]}>
      <WebView
        originWhitelist={['*']}
        source={{ html }}
        scrollEnabled={false}
        bounces={false}
        javaScriptEnabled
        domStorageEnabled
        onMessage={(event) => {
          if (!interactive || !onCoordinateChange) {
            return;
          }

          try {
            const payload = JSON.parse(event.nativeEvent.data) as Coordinate;

            if (
              Number.isFinite(payload.latitude) &&
              Number.isFinite(payload.longitude)
            ) {
              onCoordinateChange(payload);
            }
          } catch {
            return;
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    borderRadius: RADIUS.lg,
    backgroundColor: '#EAF2EA',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.lg,
    backgroundColor: '#F7F9F7',
    gap: 10,
  },
  emptyStateText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
});

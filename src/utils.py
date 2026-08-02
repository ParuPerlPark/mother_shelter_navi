from geopy.geocoders import Nominatim
from geopy.distance import geodesic
import time

geolocator = Nominatim(
    user_agent="mother_shelter_nav_tokyo_disaster_project_2026",
    timeout=5
)


def calc_distance(lat1, lon1, lat2, lon2):
    return geodesic((lat1, lon1), (lat2, lon2)).meters

def geocode_address(address):
    try:
        time.sleep(1)  # Nominatim の連続アクセス防止
        location = geolocator.geocode(address)
        if location:
            return location.latitude, location.longitude
    except Exception as e:
        print("geocode error:", e)
        return None, None
    return None, None
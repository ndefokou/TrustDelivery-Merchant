/// Pricing service for calculating delivery costs based on distance
/// Pricing rules:
/// 0-3 km = 1000 FCFA
/// 3-6 km = 1500 FCFA
/// 6-10 km = 2000 FCFA
/// 10+ km = 3000 FCFA

pub fn calculate_delivery_cost(distance_km: f64) -> i64 {
    if distance_km <= 0.0 {
        return 0;
    }
    
    if distance_km <= 3.0 {
        1000
    } else if distance_km <= 6.0 {
        1500
    } else if distance_km <= 10.0 {
        2000
    } else {
        3000
    }
}

/// Calculate distance between two coordinates using Haversine formula
pub fn calculate_distance(lat1: f64, lon1: f64, lat2: f64, lon2: f64) -> f64 {
    let earth_radius_km = 6371.0;
    
    let lat1_rad = lat1.to_radians();
    let lat2_rad = lat2.to_radians();
    let delta_lat = (lat2 - lat1).to_radians();
    let delta_lon = (lon2 - lon1).to_radians();
    
    let a = (delta_lat / 2.0).sin() * (delta_lat / 2.0).sin()
        + lat1_rad.cos() * lat2_rad.cos() * (delta_lon / 2.0).sin() * (delta_lon / 2.0).sin();
    
    let c = 2.0 * a.sqrt().atan2((1.0 - a).sqrt());
    
    earth_radius_km * c
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_pricing_tier_1() {
        assert_eq!(calculate_delivery_cost(1.0), 1000);
        assert_eq!(calculate_delivery_cost(2.5), 1000);
        assert_eq!(calculate_delivery_cost(3.0), 1000);
    }

    #[test]
    fn test_pricing_tier_2() {
        assert_eq!(calculate_delivery_cost(3.5), 1500);
        assert_eq!(calculate_delivery_cost(5.0), 1500);
        assert_eq!(calculate_delivery_cost(6.0), 1500);
    }

    #[test]
    fn test_pricing_tier_3() {
        assert_eq!(calculate_delivery_cost(7.0), 2000);
        assert_eq!(calculate_delivery_cost(9.5), 2000);
        assert_eq!(calculate_delivery_cost(10.0), 2000);
    }

    #[test]
    fn test_pricing_tier_4() {
        assert_eq!(calculate_delivery_cost(10.5), 3000);
        assert_eq!(calculate_delivery_cost(15.0), 3000);
        assert_eq!(calculate_delivery_cost(50.0), 3000);
    }

    #[test]
    fn test_zero_distance() {
        assert_eq!(calculate_delivery_cost(0.0), 0);
    }

    #[test]
    fn test_distance_calculation() {
        // Distance from Bastos to Centre Ville Yaoundé (approx 5 km)
        let distance = calculate_distance(3.8808, 11.5022, 3.8625, 11.5167);
        assert!(distance > 0.0 && distance < 10.0);
    }
}
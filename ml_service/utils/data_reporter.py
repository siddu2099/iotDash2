# ========================================
# FILE 1: ml_service/utils/data_reporter.py
# ========================================

"""
Data Reporter Module - Enhanced Two-Sensor Analysis
Generates separate statistics for front and back sensors
"""

import numpy as np
from datetime import datetime
from collections import defaultdict

class DataReporter:
    """Generate reports and statistics from dual sensor data"""
    
    @staticmethod
    def parse_timestamp(timestamp_str):
        """Parse ThingSpeak timestamp to datetime object"""
        try:
            return datetime.strptime(timestamp_str, '%Y-%m-%dT%H:%M:%SZ')
        except:
            return datetime.utcnow()
    
    @staticmethod
    def extract_sensor_values(feeds, field_name):
        """
        Extract valid sensor values from feeds
        
        Args:
            feeds (list): List of feed data
            field_name (str): 'field1' or 'field2'
        
        Returns:
            list: Valid numeric values
        """
        values = []
        for feed in feeds:
            try:
                value = float(feed.get(field_name, 0))
                if value > 0:  # Ignore zero/null values
                    values.append(value)
            except (ValueError, TypeError):
                continue
        return values
    
    @staticmethod
    def calculate_sensor_statistics(values):
        """
        Calculate comprehensive statistics for a sensor
        
        Args:
            values (list): Sensor readings
        
        Returns:
            dict: Statistical summary
        """
        if not values:
            return {
                'count': 0,
                'mean': 0,
                'median': 0,
                'min': 0,
                'max': 0,
                'std': 0,
                'variance': 0,
                'range': 0,
                'q1': 0,
                'q3': 0
            }
        
        np_values = np.array(values)
        
        return {
            'count': len(values),
            'mean': round(np.mean(np_values), 2),
            'median': round(np.median(np_values), 2),
            'min': round(np.min(np_values), 2),
            'max': round(np.max(np_values), 2),
            'std': round(np.std(np_values), 2),
            'variance': round(np.var(np_values), 2),
            'range': round(np.max(np_values) - np.min(np_values), 2),
            'q1': round(np.percentile(np_values, 25), 2),
            'q3': round(np.percentile(np_values, 75), 2)
        }
    
    @staticmethod
    def calculate_cross_analysis(front_values, back_values):
        """
        Calculate comparative metrics between sensors
        
        Args:
            front_values (list): Front sensor readings
            back_values (list): Back sensor readings
        
        Returns:
            dict: Cross-analysis metrics
        """
        if not front_values or not back_values:
            return {
                'avg_difference': 0,
                'correlation': 0,
                'data_completeness': '0%',
                'front_back_ratio': 0
            }
        
        front_mean = np.mean(front_values)
        back_mean = np.mean(back_values)
        
        # Calculate correlation if both have same length
        min_len = min(len(front_values), len(back_values))
        correlation = 0
        if min_len > 1:
            try:
                correlation = np.corrcoef(
                    front_values[:min_len], 
                    back_values[:min_len]
                )[0, 1]
                if np.isnan(correlation):
                    correlation = 0
            except:
                correlation = 0
        
        # Data completeness (assuming readings should be equal)
        total_readings = max(len(front_values), len(back_values))
        valid_pairs = min(len(front_values), len(back_values))
        completeness = (valid_pairs / total_readings * 100) if total_readings > 0 else 0
        
        return {
            'avg_difference': round(abs(front_mean - back_mean), 2),
            'correlation': round(correlation, 3),
            'data_completeness': f"{round(completeness, 1)}%",
            'front_back_ratio': round(front_mean / back_mean, 2) if back_mean != 0 else 0,
            'readings_front': len(front_values),
            'readings_back': len(back_values)
        }
    
    @staticmethod
    def calculate_hourly_stats(feeds, field_name):
        """
        Calculate hourly statistics for a specific sensor
        
        Args:
            feeds (list): List of feed data
            field_name (str): 'field1' or 'field2'
        
        Returns:
            list: Hourly statistics
        """
        hourly_data = defaultdict(list)
        
        for feed in feeds:
            timestamp = DataReporter.parse_timestamp(feed.get('created_at', ''))
            hour_key = timestamp.strftime('%Y-%m-%d %H:00')
            
            try:
                value = float(feed.get(field_name, 0))
                if value > 0:
                    hourly_data[hour_key].append(value)
            except (ValueError, TypeError):
                continue
        
        hourly_stats = []
        for hour, values in sorted(hourly_data.items()):
            if values:
                hourly_stats.append({
                    'hour': hour,
                    'avg': round(np.mean(values), 2),
                    'min': round(np.min(values), 2),
                    'max': round(np.max(values), 2),
                    'count': len(values)
                })
        
        return hourly_stats
    
    @staticmethod
    def calculate_daily_stats(feeds, field_name):
        """
        Calculate daily statistics for a specific sensor
        
        Args:
            feeds (list): List of feed data
            field_name (str): 'field1' or 'field2'
        
        Returns:
            list: Daily statistics
        """
        daily_data = defaultdict(list)
        
        for feed in feeds:
            timestamp = DataReporter.parse_timestamp(feed.get('created_at', ''))
            day_key = timestamp.strftime('%Y-%m-%d')
            
            try:
                value = float(feed.get(field_name, 0))
                if value > 0:
                    daily_data[day_key].append(value)
            except (ValueError, TypeError):
                continue
        
        daily_stats = []
        for day, values in sorted(daily_data.items()):
            if values:
                daily_stats.append({
                    'day': day,
                    'avg': round(np.mean(values), 2),
                    'min': round(np.min(values), 2),
                    'max': round(np.max(values), 2),
                    'count': len(values),
                    'std': round(np.std(values), 2)
                })
        
        return daily_stats
    
    @staticmethod
    def calculate_trend(values):
        """
        Calculate trend direction for sensor data
        
        Args:
            values (list): Sensor readings
        
        Returns:
            dict: Trend analysis
        """
        if len(values) < 2:
            return {'trend': 'insufficient_data', 'change_percent': 0}
        
        first_half_avg = np.mean(values[:len(values)//2])
        second_half_avg = np.mean(values[len(values)//2:])
        
        change_percent = ((second_half_avg - first_half_avg) / first_half_avg) * 100 if first_half_avg != 0 else 0
        
        if abs(change_percent) < 5:
            trend = 'stable'
        elif change_percent > 0:
            trend = 'increasing'
        else:
            trend = 'decreasing'
        
        return {
            'trend': trend,
            'change_percent': round(change_percent, 2)
        }
    
    @staticmethod
    def get_latest_readings(feeds):
        """
        Get the most recent readings from both sensors
        
        Args:
            feeds (list): List of feed data
        
        Returns:
            dict: Latest reading info
        """
        if not feeds:
            return None
        
        latest = feeds[-1]
        timestamp = DataReporter.parse_timestamp(latest.get('created_at', ''))
        
        return {
            'timestamp': timestamp.strftime('%Y-%m-%d %H:%M:%S UTC'),
            'front_sensor': float(latest.get('field1', 0)),
            'back_sensor': float(latest.get('field2', 0)),
            'age_minutes': round((datetime.utcnow() - timestamp).total_seconds() / 60, 1)
        }
    
    @staticmethod
    def calculate_time_span(feeds):
        """Calculate time span of data"""
        if len(feeds) < 2:
            return '0 hours'
        
        timestamps = [DataReporter.parse_timestamp(f.get('created_at', '')) for f in feeds]
        timestamps.sort()
        
        span = timestamps[-1] - timestamps[0]
        hours = span.total_seconds() / 3600
        
        if hours < 1:
            return f"{int(span.total_seconds() / 60)} minutes"
        elif hours < 24:
            return f"{round(hours, 1)} hours"
        else:
            return f"{round(hours / 24, 1)} days"
    
    @staticmethod
    def generate_full_report(feeds):
        """
        Generate comprehensive dual-sensor report
        
        Args:
            feeds (list): List of feed data from ThingSpeak
        
        Returns:
            dict: Complete report with separate sensor analysis
        """
        # Extract values for both sensors
        front_values = DataReporter.extract_sensor_values(feeds, 'field1')
        back_values = DataReporter.extract_sensor_values(feeds, 'field2')
        
        # Calculate statistics for each sensor
        front_stats = DataReporter.calculate_sensor_statistics(front_values)
        back_stats = DataReporter.calculate_sensor_statistics(back_values)
        
        # Cross-analysis
        cross_analysis = DataReporter.calculate_cross_analysis(front_values, back_values)
        
        # Trends
        front_trend = DataReporter.calculate_trend(front_values)
        back_trend = DataReporter.calculate_trend(back_values)
        
        # Hourly and daily stats for both sensors
        front_hourly = DataReporter.calculate_hourly_stats(feeds, 'field1')
        back_hourly = DataReporter.calculate_hourly_stats(feeds, 'field2')
        front_daily = DataReporter.calculate_daily_stats(feeds, 'field1')
        back_daily = DataReporter.calculate_daily_stats(feeds, 'field2')
        
        return {
            'channel_id': '3063140',
            'summary': {
                'front_sensor': {
                    **front_stats,
                    'trend': front_trend
                },
                'back_sensor': {
                    **back_stats,
                    'trend': back_trend
                },
                'cross_analysis': cross_analysis
            },
            'hourly': {
                'front_sensor': front_hourly,
                'back_sensor': back_hourly
            },
            'daily': {
                'front_sensor': front_daily,
                'back_sensor': back_daily
            },
            'latest_readings': DataReporter.get_latest_readings(feeds),
            'metadata': {
                'entries_analyzed': len(feeds),
                'time_span': DataReporter.calculate_time_span(feeds),
                'last_updated': datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')
            }
        }
import numpy as np
from typing import List, Dict, Tuple

class DataProcessor:
    """
    Utility class for processing IoT sensor data
    """
    
    @staticmethod
    def clean_data(data: List) -> np.ndarray:
        """
        Clean and convert data to numpy array
        Handles None, empty strings, and invalid values
        
        Args:
            data (List): Raw data list
        
        Returns:
            np.ndarray: Cleaned data array
        """
        clean_data = []
        for val in data:
            if val is not None and val != '':
                try:
                    clean_data.append(float(val))
                except (ValueError, TypeError):
                    clean_data.append(0.0)
            else:
                clean_data.append(0.0)
        
        return np.array(clean_data)
    
    @staticmethod
    def calculate_statistics(data: np.ndarray) -> Dict:
        """
        Calculate statistical measures for the data
        
        Args:
            data (np.ndarray): Input data array
        
        Returns:
            Dict: Dictionary containing statistical measures
        """
        return {
            'mean': float(np.mean(data)),
            'median': float(np.median(data)),
            'std': float(np.std(data)),
            'variance': float(np.var(data)),
            'min': float(np.min(data)),
            'max': float(np.max(data)),
            'q1': float(np.percentile(data, 25)),
            'q3': float(np.percentile(data, 75)),
            'iqr': float(np.percentile(data, 75) - np.percentile(data, 25))
        }
    
    @staticmethod
    def detect_outliers_iqr(data: np.ndarray, threshold: float = 1.5) -> Tuple[List[int], List[float]]:
        """
        Detect outliers using IQR (Interquartile Range) method
        
        Args:
            data (np.ndarray): Input data array
            threshold (float): IQR multiplier for outlier detection (default 1.5)
        
        Returns:
            Tuple[List[int], List[float]]: Indices and values of outliers
        """
        q1 = np.percentile(data, 25)
        q3 = np.percentile(data, 75)
        iqr = q3 - q1
        
        lower_bound = q1 - threshold * iqr
        upper_bound = q3 + threshold * iqr
        
        outlier_indices = []
        outlier_values = []
        
        for idx, val in enumerate(data):
            if val < lower_bound or val > upper_bound:
                outlier_indices.append(idx)
                outlier_values.append(float(val))
        
        return outlier_indices, outlier_values
    
    @staticmethod
    def detect_outliers_zscore(data: np.ndarray, threshold: float = 3.0) -> Tuple[List[int], List[float]]:
        """
        Detect outliers using Z-score method
        
        Args:
            data (np.ndarray): Input data array
            threshold (float): Z-score threshold (default 3.0)
        
        Returns:
            Tuple[List[int], List[float]]: Indices and values of outliers
        """
        mean = np.mean(data)
        std = np.std(data)
        
        if std == 0:
            return [], []
        
        z_scores = np.abs((data - mean) / std)
        
        outlier_indices = []
        outlier_values = []
        
        for idx, (z_score, val) in enumerate(zip(z_scores, data)):
            if z_score > threshold:
                outlier_indices.append(idx)
                outlier_values.append(float(val))
        
        return outlier_indices, outlier_values
    
    @staticmethod
    def normalize_data(data: np.ndarray, method: str = 'minmax') -> np.ndarray:
        """
        Normalize data using specified method
        
        Args:
            data (np.ndarray): Input data array
            method (str): Normalization method ('minmax' or 'zscore')
        
        Returns:
            np.ndarray: Normalized data
        """
        if method == 'minmax':
            min_val = np.min(data)
            max_val = np.max(data)
            if max_val - min_val == 0:
                return np.zeros_like(data)
            return (data - min_val) / (max_val - min_val)
        
        elif method == 'zscore':
            mean = np.mean(data)
            std = np.std(data)
            if std == 0:
                return np.zeros_like(data)
            return (data - mean) / std
        
        else:
            raise ValueError(f"Unknown normalization method: {method}")
    
    @staticmethod
    def extract_features(data: np.ndarray, window_size: int = 10) -> Dict:
        """
        Extract time-series features from data
        
        Args:
            data (np.ndarray): Input data array
            window_size (int): Window size for rolling statistics
        
        Returns:
            Dict: Dictionary containing extracted features
        """
        features = {
            'mean': float(np.mean(data)),
            'std': float(np.std(data)),
            'min': float(np.min(data)),
            'max': float(np.max(data)),
            'range': float(np.max(data) - np.min(data)),
            'skewness': float(DataProcessor._calculate_skewness(data)),
            'kurtosis': float(DataProcessor._calculate_kurtosis(data))
        }
        
        # Add rolling statistics if data is long enough
        if len(data) >= window_size:
            rolling_mean = DataProcessor._rolling_window(data, window_size, np.mean)
            rolling_std = DataProcessor._rolling_window(data, window_size, np.std)
            
            features['rolling_mean_std'] = float(np.std(rolling_mean))
            features['rolling_std_mean'] = float(np.mean(rolling_std))
        
        return features
    
    @staticmethod
    def _rolling_window(data: np.ndarray, window_size: int, func) -> np.ndarray:
        """Apply a function over a rolling window"""
        result = []
        for i in range(len(data) - window_size + 1):
            window = data[i:i + window_size]
            result.append(func(window))
        return np.array(result)
    
    @staticmethod
    def _calculate_skewness(data: np.ndarray) -> float:
        """Calculate skewness of the data"""
        mean = np.mean(data)
        std = np.std(data)
        if std == 0:
            return 0.0
        n = len(data)
        return (n / ((n - 1) * (n - 2))) * np.sum(((data - mean) / std) ** 3)
    
    @staticmethod
    def _calculate_kurtosis(data: np.ndarray) -> float:
        """Calculate kurtosis of the data"""
        mean = np.mean(data)
        std = np.std(data)
        if std == 0:
            return 0.0
        n = len(data)
        return (n * (n + 1) / ((n - 1) * (n - 2) * (n - 3))) * np.sum(((data - mean) / std) ** 4) - \
               (3 * (n - 1) ** 2 / ((n - 2) * (n - 3)))
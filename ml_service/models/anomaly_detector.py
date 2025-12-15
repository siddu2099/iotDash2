import numpy as np
from sklearn.ensemble import IsolationForest
import pickle
import os

class AnomalyDetector:
    """
    Anomaly Detection using Isolation Forest algorithm
    """
    
    def __init__(self, contamination=0.1, random_state=42):
        """
        Initialize the Isolation Forest model
        
        Args:
            contamination (float): Expected proportion of outliers (0.1 = 10%)
            random_state (int): Random seed for reproducibility
        """
        self.contamination = contamination
        self.random_state = random_state
        self.model = IsolationForest(
            contamination=contamination,
            random_state=random_state,
            n_estimators=100,
            max_samples='auto',
            max_features=1.0,
            bootstrap=False
        )
        self.is_trained = False
        self.model_path = 'models/saved_model.pkl'
        
        # Try to load existing model
        self._load_model()
    
    def train(self, X):
        """
        Train the Isolation Forest model
        
        Args:
            X (numpy.ndarray): Training data of shape (n_samples, n_features)
        
        Returns:
            self: Returns the instance itself
        """
        if X.ndim == 1:
            X = X.reshape(-1, 1)
        
        print(f"Training Isolation Forest with {X.shape[0]} samples...")
        self.model.fit(X)
        self.is_trained = True
        
        # Save the trained model
        self._save_model()
        
        print("✅ Model trained successfully!")
        return self
    
    def detect(self, X):
        """
        Detect anomalies in the data
        
        Args:
            X (numpy.ndarray): Data to analyze of shape (n_samples, n_features)
        
        Returns:
            numpy.ndarray: Array of predictions (-1 for anomaly, 1 for normal)
        """
        if X.ndim == 1:
            X = X.reshape(-1, 1)
        
        # If model is not trained, train it with the current data
        if not self.is_trained:
            print("⚠️  Model not trained. Training with current data...")
            self.train(X)
        
        # Predict: -1 for anomalies, 1 for normal points
        predictions = self.model.predict(X)
        
        return predictions
    
    def calculate_severity(self, value, data_list):
        """
        Calculate anomaly severity based on how far the value is from normal range
        
        Args:
            value (float): The anomalous value
            data_list (list): List of all data points
        
        Returns:
            str: Severity level ('low', 'medium', 'high')
        """
        mean = np.mean(data_list)
        std = np.std(data_list)
        
        # Calculate z-score (how many standard deviations away)
        if std == 0:
            return 'medium'
        
        z_score = abs((value - mean) / std)
        
        if z_score > 3:
            return 'high'
        elif z_score > 2:
            return 'medium'
        else:
            return 'low'
    
    def get_anomaly_score(self, X):
        """
        Get anomaly scores for the data
        Lower scores indicate more anomalous points
        
        Args:
            X (numpy.ndarray): Data to analyze
        
        Returns:
            numpy.ndarray: Anomaly scores
        """
        if X.ndim == 1:
            X = X.reshape(-1, 1)
        
        if not self.is_trained:
            self.train(X)
        
        # Get anomaly scores (lower = more anomalous)
        scores = self.model.score_samples(X)
        return scores
    
    def _save_model(self):
        """Save the trained model to disk"""
        try:
            os.makedirs(os.path.dirname(self.model_path), exist_ok=True)
            with open(self.model_path, 'wb') as f:
                pickle.dump(self.model, f)
            print(f"💾 Model saved to {self.model_path}")
        except Exception as e:
            print(f"⚠️  Error saving model: {e}")
    
    def _load_model(self):
        """Load a previously trained model from disk"""
        try:
            if os.path.exists(self.model_path):
                with open(self.model_path, 'rb') as f:
                    self.model = pickle.load(f)
                self.is_trained = True
                print(f"✅ Loaded existing model from {self.model_path}")
        except Exception as e:
            print(f"⚠️  Could not load model: {e}")
            print("Will train a new model when data is received.")
    
    def reset_model(self):
        """Reset the model to untrained state"""
        self.model = IsolationForest(
            contamination=self.contamination,
            random_state=self.random_state,
            n_estimators=100
        )
        self.is_trained = False
        print("🔄 Model reset to untrained state")
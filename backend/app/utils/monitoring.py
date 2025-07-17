import time
import logging
import asyncio
from typing import Dict, List, Optional
from datetime import datetime, timedelta
from collections import defaultdict, deque

logger = logging.getLogger(__name__)

class PerformanceMonitor:
    def __init__(self, max_history: int = 1000):
        self.max_history = max_history
        self.request_times = deque(maxlen=max_history)
        self.agent_times = defaultdict(lambda: deque(maxlen=100))
        self.error_counts = defaultdict(int)
        self.start_time = datetime.now()
        
    def record_request(self, endpoint: str, duration: float, status_code: int):
        """Enregistre les métriques d'une requête"""
        self.request_times.append({
            'endpoint': endpoint,
            'duration': duration,
            'timestamp': datetime.now(),
            'status_code': status_code
        })
        
        if status_code >= 400:
            self.error_counts[endpoint] += 1
    
    def record_agent_call(self, agent_role: str, duration: float, success: bool):
        """Enregistre les métriques d'un appel d'agent"""
        self.agent_times[agent_role].append({
            'duration': duration,
            'timestamp': datetime.now(),
            'success': success
        })
    
    def get_stats(self) -> Dict:
        """Retourne les statistiques de performance"""
        now = datetime.now()
        uptime = (now - self.start_time).total_seconds()
        
        # Stats requêtes
        recent_requests = [
            req for req in self.request_times 
            if (now - req['timestamp']).total_seconds() < 300  # 5 minutes
        ]
        
        avg_response_time = 0
        if recent_requests:
            avg_response_time = sum(req['duration'] for req in recent_requests) / len(recent_requests)
        
        # Stats agents
        agent_stats = {}
        for agent_role, times in self.agent_times.items():
            recent_times = [
                call for call in times 
                if (now - call['timestamp']).total_seconds() < 300
            ]
            
            if recent_times:
                avg_time = sum(call['duration'] for call in recent_times) / len(recent_times)
                success_rate = sum(1 for call in recent_times if call['success']) / len(recent_times)
                agent_stats[agent_role] = {
                    'avg_response_time': avg_time,
                    'success_rate': success_rate,
                    'call_count': len(recent_times)
                }
        
        return {
            'uptime_seconds': uptime,
            'total_requests': len(self.request_times),
            'recent_requests_5min': len(recent_requests),
            'avg_response_time': avg_response_time,
            'error_counts': dict(self.error_counts),
            'agent_stats': agent_stats,
            'timestamp': now.isoformat()
        }

# Instance globale
performance_monitor = PerformanceMonitor()
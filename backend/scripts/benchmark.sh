#!/bin/bash

echo "📊 Benchmark Mon Atelier IA"
echo "============================"

# Script de benchmark pour mesurer les performances
python3 -c "
import asyncio
import httpx
import time
import statistics
import sys
sys.path.append('.')

async def benchmark():
    base_url = 'http://localhost:8000'
    
    print('🚀 Démarrage benchmark...')
    
    async with httpx.AsyncClient(base_url=base_url, timeout=120.0) as client:
        # Test API health (multiple appels)
        print('📊 Test API Health (10 appels)...')
        health_times = []
        for i in range(10):
            start = time.time()
            response = await client.get('/health')
            duration = time.time() - start
            health_times.append(duration)
            if response.status_code != 200:
                print(f'❌ Erreur appel {i+1}')
        
        print(f'   Moyenne: {statistics.mean(health_times):.3f}s')
        print(f'   Médiane: {statistics.median(health_times):.3f}s')
        print(f'   Min/Max: {min(health_times):.3f}s / {max(health_times):.3f}s')
        
        # Test agents (3 appels chacun)
        agents = ['visionnaire', 'architecte', 'frontend_engineer']
        message = 'Explique brièvement ton rôle'
        
        print(f'🤖 Test Agents (3 appels x {len(agents)} agents)...')
        
        for agent in agents:
            agent_times = []
            response_lengths = []
            
            for i in range(3):
                start = time.time()
                response = await client.post('/chat', json={
                    'message': message,
                    'agent': agent
                })
                duration = time.time() - start
                
                if response.status_code == 200:
                    resp_data = response.json()
                    response_length = len(resp_data.get('response', ''))
                    agent_times.append(duration)
                    response_lengths.append(response_length)
                else:
                    print(f'❌ Erreur {agent} appel {i+1}')
            
            if agent_times:
                avg_time = statistics.mean(agent_times)
                avg_length = statistics.mean(response_lengths)
                chars_per_sec = avg_length / avg_time if avg_time > 0 else 0
                
                print(f'   {agent.ljust(20)}: {avg_time:.2f}s, {avg_length:.0f} chars, {chars_per_sec:.1f} c/s')
        
        # Test création projet
        print('📁 Test Création Projet...')
        start = time.time()
        response = await client.post('/projects', json={
            'name': 'Benchmark Test',
            'description': 'Test performance'
        })
        project_time = time.time() - start
        
        if response.status_code == 200:
            project_id = response.json()['id']
            print(f'   Création: {project_time:.3f}s')
            
            # Test sauvegarde fichier
            start = time.time()
            await client.post(f'/projects/{project_id}/files', json={
                'path': 'test.txt',
                'content': 'Contenu de test pour benchmark' * 100
            })
            file_time = time.time() - start
            print(f'   Fichier: {file_time:.3f}s')
            
            # Nettoyer
            await client.delete(f'/projects/{project_id}')
        
        print('✅ Benchmark terminé')

asyncio.run(benchmark())
"

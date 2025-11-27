// Life-Line Air Drone Demo Application
class DroneDemo {
    constructor() {
        // Application data from JSON
        this.environments = [
            {
                "id": "forest",
                "name": "Forest Canopy Scenario",
                "description": "Dense vegetation, GPS-denied navigation challenges",
                "weather": "Overcast, 15°C, Light wind",
                "challenges": ["GPS signal degradation", "Dense canopy navigation", "Limited landing zones"],
                "mission_type": "Search and rescue medical supply delivery"
            },
            {
                "id": "desert", 
                "name": "Desert Plain Scenario",
                "description": "Harsh weather simulation, dust/sand effects",
                "weather": "Clear, 35°C, Moderate wind with dust",
                "challenges": ["Extreme temperature", "Dust interference", "Long range flight"],
                "mission_type": "Emergency medical transport"
            },
            {
                "id": "urban",
                "name": "Urban Scenario", 
                "description": "Complex buildings, obstacle-rich navigation",
                "weather": "Partly cloudy, 22°C, Variable wind",
                "challenges": ["Building obstacles", "Air traffic", "Precision landing"],
                "mission_type": "Hospital-to-hospital transport"
            }
        ];

        this.missionWaypoints = {
            "forest": [
                {"lat": 37.7749, "lng": -122.4194, "alt": 50, "action": "takeoff", "description": "Launch point"},
                {"lat": 37.7849, "lng": -122.4294, "alt": 100, "action": "navigate", "description": "Clear treeline"},
                {"lat": 37.7949, "lng": -122.4394, "alt": 80, "action": "search", "description": "Search pattern"},
                {"lat": 37.8049, "lng": -122.4494, "alt": 30, "action": "deliver", "description": "Medical delivery"},
                {"lat": 37.7749, "lng": -122.4194, "alt": 0, "action": "land", "description": "Return to base"}
            ],
            "desert": [
                {"lat": 36.1699, "lng": -115.1398, "alt": 50, "action": "takeoff", "description": "Launch point"},
                {"lat": 36.2699, "lng": -115.2398, "alt": 150, "action": "cruise", "description": "High altitude cruise"},
                {"lat": 36.3699, "lng": -115.3398, "alt": 150, "action": "navigate", "description": "Long range transit"},
                {"lat": 36.4699, "lng": -115.4398, "alt": 50, "action": "deliver", "description": "Emergency site"},
                {"lat": 36.1699, "lng": -115.1398, "alt": 0, "action": "land", "description": "Return to base"}
            ],
            "urban": [
                {"lat": 40.7128, "lng": -74.0060, "alt": 50, "action": "takeoff", "description": "Hospital rooftop"},
                {"lat": 40.7228, "lng": -74.0160, "alt": 120, "action": "avoid", "description": "Building clearance"},
                {"lat": 40.7328, "lng": -74.0260, "alt": 100, "action": "navigate", "description": "Urban corridor"},
                {"lat": 40.7428, "lng": -74.0360, "alt": 60, "action": "precision", "description": "Approach target hospital"},
                {"lat": 40.7528, "lng": -74.0460, "alt": 0, "action": "land", "description": "Destination hospital"}
            ]
        };

        this.medicalPayloads = [
            {
                "id": "aed",
                "name": "Emergency AED Kit",
                "weight": "3.2 kg",
                "contents": ["Automated External Defibrillator", "CPR Mask", "Medical Gloves"],
                "temperature_controlled": false
            },
            {
                "id": "blood",
                "name": "Blood Transport Kit", 
                "weight": "2.8 kg",
                "contents": ["Blood bags (2 units)", "Temperature sensors", "Shock-absorbing case"],
                "temperature_controlled": true
            },
            {
                "id": "medication",
                "name": "Medication Delivery",
                "weight": "1.5 kg", 
                "contents": ["Emergency medications", "Epinephrine auto-injectors", "Medical supplies"],
                "temperature_controlled": true
            }
        ];

        this.systemStatus = [
            {"component": "PX4 SITL", "status": "Connected", "health": "Good"},
            {"component": "Gazebo Simulator", "status": "Running", "health": "Good"},
            {"component": "MAVLink Telemetry", "status": "Active", "health": "Good"},
            {"component": "GPS Module", "status": "Locked", "health": "Good"},
            {"component": "Flight Controller", "status": "Armed", "health": "Good"}
        ];

        // Mission state
        this.currentEnvironment = 'forest';
        this.currentPayload = 'aed';
        this.missionActive = false;
        this.missionPaused = false;
        this.currentWaypoint = 0;
        this.missionStartTime = null;
        this.flightTime = 0;

        // Telemetry data
        this.telemetryData = {
            lat: 37.7749,
            lng: -122.4194,
            altitude: 0,
            groundSpeed: 0,
            batteryLevel: 100,
            payloadTemp: 4,
            signalStrength: 98,
            motorRPM: 0
        };

        // Charts
        this.charts = {};
        
        // Timers
        this.telemetryTimer = null;
        this.missionTimer = null;

        this.init();
    }

    init() {
        this.setupNavigation();
        this.setupEventListeners();
        this.updateEnvironmentDetails();
        this.updateSystemStatus();
        this.updatePayloadDetails();
        this.initializeCharts();
        this.addLogEntry('info', 'System initialized and ready for operation');
    }

    setupNavigation() {
        const navBtns = document.querySelectorAll('.nav-btn');
        navBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const targetView = btn.getAttribute('data-view');
                this.switchView(targetView);
                
                // Update active nav button
                navBtns.forEach(b => b.classList.remove('nav-btn--active'));
                btn.classList.add('nav-btn--active');
            });
        });
    }

    switchView(viewId) {
        const views = document.querySelectorAll('.view');
        views.forEach(view => view.classList.remove('view--active'));
        
        const targetView = document.getElementById(viewId);
        if (targetView) {
            targetView.classList.add('view--active');
        }

        // Update charts if switching to telemetry dashboard
        if (viewId === 'telemetryDashboard') {
            setTimeout(() => this.updateCharts(), 100);
        }
    }

    setupEventListeners() {
        // Environment selector
        const envSelect = document.getElementById('environmentSelect');
        envSelect.addEventListener('change', (e) => {
            this.currentEnvironment = e.target.value;
            this.updateEnvironmentDetails();
            this.addLogEntry('info', `Environment changed to ${this.environments.find(env => env.id === this.currentEnvironment).name}`);
        });

        // Payload selector
        const payloadSelect = document.getElementById('payloadSelect');
        payloadSelect.addEventListener('change', (e) => {
            this.currentPayload = e.target.value;
            this.updatePayloadDetails();
            this.addLogEntry('info', `Payload changed to ${this.medicalPayloads.find(p => p.id === this.currentPayload).name}`);
        });

        // Mission controls
        document.getElementById('startMissionBtn').addEventListener('click', () => this.startMission());
        document.getElementById('pauseMissionBtn').addEventListener('click', () => this.togglePauseMission());
        document.getElementById('abortMissionBtn').addEventListener('click', () => this.abortMission());
        document.getElementById('resetDemoBtn').addEventListener('click', () => this.resetDemo());

        // Navigation buttons
        document.getElementById('viewTelemetryBtn').addEventListener('click', () => {
            this.switchView('telemetryDashboard');
            document.querySelector('[data-view="telemetryDashboard"]').click();
        });

        document.getElementById('planMissionBtn').addEventListener('click', () => {
            this.switchView('missionPlanning');
            document.querySelector('[data-view="missionPlanning"]').click();
        });

        // Map controls
        document.getElementById('centerMapBtn').addEventListener('click', () => {
            this.centerMapView();
        });

        document.getElementById('followDroneBtn').addEventListener('click', () => {
            this.toggleFollowDrone();
        });

        // Log controls
        document.getElementById('clearLogBtn').addEventListener('click', () => this.clearLog());
        document.getElementById('exportLogBtn').addEventListener('click', () => this.exportLog());
    }

    updateEnvironmentDetails() {
        const env = this.environments.find(e => e.id === this.currentEnvironment);
        const detailsDiv = document.getElementById('environmentDetails');
        
        detailsDiv.innerHTML = `
            <p class="environment-description">${env.description}</p>
            <div class="environment-tags">
                ${env.challenges.map(challenge => `<span class="tag">${challenge}</span>`).join('')}
            </div>
        `;
    }

    updateSystemStatus() {
        const statusList = document.getElementById('systemStatusList');
        statusList.innerHTML = this.systemStatus.map(status => `
            <div class="system-status-item">
                <span class="system-name">${status.component}</span>
                <div class="status status--${status.health === 'Good' ? 'success' : 'warning'}">${status.status}</div>
            </div>
        `).join('');
    }

    updatePayloadDetails() {
        const payload = this.medicalPayloads.find(p => p.id === this.currentPayload);
        const detailsDiv = document.getElementById('payloadDetails');
        
        detailsDiv.innerHTML = `
            <div class="payload-info">
                <div class="payload-info-item">
                    <span class="stat-label">Weight</span>
                    <span class="stat-value">${payload.weight}</span>
                </div>
                <div class="payload-info-item">
                    <span class="stat-label">Temperature Control</span>
                    <span class="stat-value">${payload.temperature_controlled ? 'Yes' : 'No'}</span>
                </div>
            </div>
            <div class="payload-contents">
                <h4>Contents:</h4>
                <ul>
                    ${payload.contents.map(item => `<li>${item}</li>`).join('')}
                </ul>
            </div>
        `;

        // Update payload temperature based on whether it's temperature controlled
        if (payload.temperature_controlled) {
            this.telemetryData.payloadTemp = 4; // Keep cold
        } else {
            this.telemetryData.payloadTemp = 22; // Ambient temperature
        }
    }

    startMission() {
        if (this.missionActive) return;

        this.missionActive = true;
        this.missionPaused = false;
        this.currentWaypoint = 0;
        this.missionStartTime = Date.now();
        this.flightTime = 0;

        // Update UI
        document.getElementById('startMissionBtn').disabled = true;
        document.getElementById('pauseMissionBtn').disabled = false;
        document.getElementById('abortMissionBtn').disabled = false;
        document.getElementById('missionStatus').textContent = 'ACTIVE';
        document.getElementById('missionStatus').className = 'status status--success';

        // Switch to mission control view
        this.switchView('missionControl');
        document.querySelector('[data-view="missionControl"]').click();

        // Start telemetry updates
        this.startTelemetryUpdates();
        this.startMissionProgress();

        this.addLogEntry('success', 'Mission started successfully');
        this.addLogEntry('info', `Environment: ${this.environments.find(env => env.id === this.currentEnvironment).name}`);
        this.addLogEntry('info', `Payload: ${this.medicalPayloads.find(p => p.id === this.currentPayload).name}`);

        // Initialize mission timeline
        this.updateMissionTimeline();
        this.updateWaypoints();
    }

    togglePauseMission() {
        if (!this.missionActive) return;

        this.missionPaused = !this.missionPaused;
        const pauseBtn = document.getElementById('pauseMissionBtn');
        
        if (this.missionPaused) {
            pauseBtn.textContent = 'RESUME';
            document.getElementById('missionStatus').textContent = 'PAUSED';
            document.getElementById('missionStatus').className = 'status status--warning';
            this.addLogEntry('warning', 'Mission paused');
        } else {
            pauseBtn.textContent = 'PAUSE';
            document.getElementById('missionStatus').textContent = 'ACTIVE';
            document.getElementById('missionStatus').className = 'status status--success';
            this.addLogEntry('info', 'Mission resumed');
        }
    }

    abortMission() {
        if (!this.missionActive) return;

        this.missionActive = false;
        this.missionPaused = false;
        
        // Stop timers
        if (this.telemetryTimer) clearInterval(this.telemetryTimer);
        if (this.missionTimer) clearInterval(this.missionTimer);

        // Reset telemetry
        const waypoints = this.missionWaypoints[this.currentEnvironment];
        this.telemetryData.lat = waypoints[0].lat;
        this.telemetryData.lng = waypoints[0].lng;
        this.telemetryData.altitude = 0;
        this.telemetryData.groundSpeed = 0;
        this.telemetryData.motorRPM = 0;

        // Update UI
        document.getElementById('startMissionBtn').disabled = false;
        document.getElementById('pauseMissionBtn').disabled = true;
        document.getElementById('pauseMissionBtn').textContent = 'PAUSE';
        document.getElementById('abortMissionBtn').disabled = true;
        document.getElementById('missionStatus').textContent = 'ABORTED';
        document.getElementById('missionStatus').className = 'status status--error';

        this.addLogEntry('error', 'Mission aborted - returning to launch point');
        this.updateTelemetryDisplay();
    }

    resetDemo() {
        // Stop any active mission
        if (this.missionActive) {
            this.abortMission();
        }

        // Reset all values
        this.currentWaypoint = 0;
        this.flightTime = 0;
        this.missionStartTime = null;
        
        // Reset telemetry to starting values
        const waypoints = this.missionWaypoints[this.currentEnvironment];
        this.telemetryData = {
            lat: waypoints[0].lat,
            lng: waypoints[0].lng,
            altitude: 0,
            groundSpeed: 0,
            batteryLevel: 100,
            payloadTemp: this.medicalPayloads.find(p => p.id === this.currentPayload).temperature_controlled ? 4 : 22,
            signalStrength: 98,
            motorRPM: 0
        };

        // Update mission status
        document.getElementById('missionStatus').textContent = 'READY';
        document.getElementById('missionStatus').className = 'status status--info';

        // Reset progress
        document.getElementById('missionProgress').style.width = '0%';

        // Clear timeline
        document.getElementById('missionTimeline').innerHTML = '';

        // Switch back to dashboard
        this.switchView('dashboard');
        document.querySelector('[data-view="dashboard"]').click();

        this.updateTelemetryDisplay();
        this.addLogEntry('info', 'Demo reset - all systems ready');
    }

    startTelemetryUpdates() {
        this.telemetryTimer = setInterval(() => {
            if (!this.missionActive || this.missionPaused) return;

            this.updateTelemetryData();
            this.updateTelemetryDisplay();
        }, 1000);
    }

    startMissionProgress() {
        this.missionTimer = setInterval(() => {
            if (!this.missionActive || this.missionPaused) return;

            this.flightTime++;
            this.updateFlightTime();
            this.progressMission();
        }, 1000);
    }

    updateTelemetryData() {
        const waypoints = this.missionWaypoints[this.currentEnvironment];
        const currentWp = waypoints[this.currentWaypoint];
        const nextWp = waypoints[this.currentWaypoint + 1];

        if (!currentWp) return;

        // Simulate movement towards next waypoint
        if (nextWp) {
            const progress = (this.flightTime % 30) / 30; // 30 seconds per waypoint
            
            this.telemetryData.lat = currentWp.lat + (nextWp.lat - currentWp.lat) * progress;
            this.telemetryData.lng = currentWp.lng + (nextWp.lng - currentWp.lng) * progress;
            this.telemetryData.altitude = currentWp.alt + (nextWp.alt - currentWp.alt) * progress;
        }

        // Simulate realistic telemetry variations
        this.telemetryData.groundSpeed = this.telemetryData.altitude > 5 ? 
            Math.random() * 5 + 15 : Math.random() * 2;
        
        // Battery drain
        this.telemetryData.batteryLevel = Math.max(20, 100 - (this.flightTime * 0.5));
        
        // Motor RPM based on altitude and speed
        this.telemetryData.motorRPM = this.telemetryData.altitude > 5 ? 
            Math.random() * 1000 + 5000 : Math.random() * 500;

        // Signal strength variations based on environment
        let baseSignal = 98;
        if (this.currentEnvironment === 'forest') baseSignal = 75; // GPS degradation
        if (this.currentEnvironment === 'urban') baseSignal = 85; // Building interference
        this.telemetryData.signalStrength = Math.max(60, baseSignal + Math.random() * 10 - 5);

        // Payload temperature variations
        const payload = this.medicalPayloads.find(p => p.id === this.currentPayload);
        if (payload.temperature_controlled) {
            this.telemetryData.payloadTemp = 4 + Math.random() * 2 - 1; // 3-5°C
        } else {
            const envTemp = this.currentEnvironment === 'desert' ? 35 : 
                           this.currentEnvironment === 'forest' ? 15 : 22;
            this.telemetryData.payloadTemp = envTemp + Math.random() * 4 - 2;
        }
    }

    progressMission() {
        const waypoints = this.missionWaypoints[this.currentEnvironment];
        const waypointDuration = 30; // seconds per waypoint
        const totalDuration = waypoints.length * waypointDuration;
        const progress = Math.min(100, (this.flightTime / totalDuration) * 100);

        // Update progress bar
        document.getElementById('missionProgress').style.width = `${progress}%`;

        // Check waypoint progression
        const newWaypoint = Math.floor(this.flightTime / waypointDuration);
        if (newWaypoint !== this.currentWaypoint && newWaypoint < waypoints.length) {
            this.currentWaypoint = newWaypoint;
            this.addLogEntry('success', `Waypoint ${this.currentWaypoint + 1} reached: ${waypoints[this.currentWaypoint].description}`);
            this.updateMissionTimeline();
            this.updateWaypoints();
        }

        // Update waypoint status
        document.getElementById('waypointStatus').textContent = 
            `Waypoint ${this.currentWaypoint + 1} of ${waypoints.length}`;

        // Check mission completion
        if (this.flightTime >= totalDuration && this.missionActive) {
            this.completeMission();
        }
    }

    completeMission() {
        this.missionActive = false;
        
        // Stop timers
        if (this.telemetryTimer) clearInterval(this.telemetryTimer);
        if (this.missionTimer) clearInterval(this.missionTimer);

        // Update UI
        document.getElementById('startMissionBtn').disabled = false;
        document.getElementById('pauseMissionBtn').disabled = true;
        document.getElementById('abortMissionBtn').disabled = true;
        document.getElementById('missionStatus').textContent = 'COMPLETED';
        document.getElementById('missionStatus').className = 'status status--success';

        // Final telemetry values
        const waypoints = this.missionWaypoints[this.currentEnvironment];
        const lastWaypoint = waypoints[waypoints.length - 1];
        this.telemetryData.lat = lastWaypoint.lat;
        this.telemetryData.lng = lastWaypoint.lng;
        this.telemetryData.altitude = 0;
        this.telemetryData.groundSpeed = 0;
        this.telemetryData.motorRPM = 0;

        this.updateTelemetryDisplay();
        this.addLogEntry('success', 'Mission completed successfully');
        this.addLogEntry('info', `Total flight time: ${Math.floor(this.flightTime / 60)}:${(this.flightTime % 60).toString().padStart(2, '0')}`);
    }

    updateTelemetryDisplay() {
        // Update dashboard stats
        document.getElementById('batteryLevel').textContent = `${Math.round(this.telemetryData.batteryLevel)}%`;
        document.getElementById('payloadTemp').textContent = `${Math.round(this.telemetryData.payloadTemp)}°C`;
        document.getElementById('signalStrength').textContent = `${Math.round(this.telemetryData.signalStrength)}%`;

        // Update detailed telemetry
        this.updateTelemetryGrid();

        // Update drone position on map
        this.updateDronePosition();
    }

    updateTelemetryGrid() {
        const grid = document.getElementById('telemetryGrid');
        if (!grid) return;

        grid.innerHTML = `
            <div class="telemetry-item">
                <div class="telemetry-label">GPS Latitude</div>
                <div class="telemetry-value">${this.telemetryData.lat.toFixed(4)}°</div>
            </div>
            <div class="telemetry-item">
                <div class="telemetry-label">GPS Longitude</div>
                <div class="telemetry-value">${this.telemetryData.lng.toFixed(4)}°</div>
            </div>
            <div class="telemetry-item">
                <div class="telemetry-label">Altitude</div>
                <div class="telemetry-value ${this.telemetryData.altitude > 150 ? 'telemetry-value--warning' : ''}">${Math.round(this.telemetryData.altitude)} m</div>
            </div>
            <div class="telemetry-item">
                <div class="telemetry-label">Ground Speed</div>
                <div class="telemetry-value">${Math.round(this.telemetryData.groundSpeed)} m/s</div>
            </div>
            <div class="telemetry-item">
                <div class="telemetry-label">Battery Level</div>
                <div class="telemetry-value ${this.telemetryData.batteryLevel < 30 ? 'telemetry-value--critical' : this.telemetryData.batteryLevel < 50 ? 'telemetry-value--warning' : ''}">${Math.round(this.telemetryData.batteryLevel)}%</div>
            </div>
            <div class="telemetry-item">
                <div class="telemetry-label">Payload Temp</div>
                <div class="telemetry-value ${Math.abs(this.telemetryData.payloadTemp - 4) > 3 ? 'telemetry-value--warning' : ''}">${Math.round(this.telemetryData.payloadTemp)}°C</div>
            </div>
            <div class="telemetry-item">
                <div class="telemetry-label">Signal Strength</div>
                <div class="telemetry-value ${this.telemetryData.signalStrength < 70 ? 'telemetry-value--warning' : ''}">${Math.round(this.telemetryData.signalStrength)}%</div>
            </div>
            <div class="telemetry-item">
                <div class="telemetry-label">Motor RPM</div>
                <div class="telemetry-value">${Math.round(this.telemetryData.motorRPM)}</div>
            </div>
        `;
    }

    updateDronePosition() {
        const droneIcon = document.getElementById('droneIcon');
        if (!droneIcon) return;

        // Simple position mapping (normalized to container)
        const mapContainer = document.getElementById('missionMap');
        if (!mapContainer) return;

        const rect = mapContainer.getBoundingClientRect();
        const x = Math.random() * (rect.width - 50) + 25; // Random position for demo
        const y = Math.random() * (rect.height - 50) + 25;

        droneIcon.style.left = `${x}px`;
        droneIcon.style.top = `${y}px`;
    }

    updateMissionTimeline() {
        const timeline = document.getElementById('missionTimeline');
        if (!timeline) return;

        const waypoints = this.missionWaypoints[this.currentEnvironment];
        timeline.innerHTML = waypoints.map((waypoint, index) => {
            let status = 'pending';
            let iconClass = '';
            
            if (index < this.currentWaypoint) {
                status = 'completed';
                iconClass = 'timeline-icon--completed';
            } else if (index === this.currentWaypoint) {
                status = 'current';
                iconClass = 'timeline-icon--current';
            }

            return `
                <div class="timeline-item timeline-item--${status}">
                    <div class="timeline-icon ${iconClass}">${index + 1}</div>
                    <div class="timeline-content">
                        <div class="timeline-title">${waypoint.action.toUpperCase()}: ${waypoint.description}</div>
                        <div class="timeline-description">Altitude: ${waypoint.alt}m | Action: ${waypoint.action}</div>
                    </div>
                </div>
            `;
        }).join('');
    }

    updateWaypoints() {
        const waypointMarkers = document.getElementById('waypointMarkers');
        if (!waypointMarkers) return;

        const waypoints = this.missionWaypoints[this.currentEnvironment];
        waypointMarkers.innerHTML = waypoints.map((waypoint, index) => {
            let markerClass = 'waypoint-marker';
            
            if (index < this.currentWaypoint) {
                markerClass += ' waypoint-marker--completed';
            } else if (index === this.currentWaypoint) {
                markerClass += ' waypoint-marker--current';
            }

            // Position markers randomly for demo
            const x = Math.random() * 80 + 10; // 10-90% of container width
            const y = Math.random() * 80 + 10; // 10-90% of container height

            return `<div class="${markerClass}" style="left: ${x}%; top: ${y}%; z-index: ${10 + index};"></div>`;
        }).join('');
    }

    updateFlightTime() {
        const minutes = Math.floor(this.flightTime / 60);
        const seconds = this.flightTime % 60;
        document.getElementById('flightTime').textContent = 
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    initializeCharts() {
        this.initChart('altitudeChart', 'Altitude (m)', '#1FB8CD');
        this.initChart('batteryChart', 'Battery (%)', '#FFC185');
        this.initChart('speedChart', 'Speed (m/s)', '#B4413C');
        this.initChart('temperatureChart', 'Temperature (°C)', '#5D878F');
    }

    initChart(canvasId, label, color) {
        const ctx = document.getElementById(canvasId);
        if (!ctx) return;

        const chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: Array.from({length: 60}, (_, i) => i), // 60 data points
                datasets: [{
                    label: label,
                    data: Array(60).fill(0),
                    borderColor: color,
                    backgroundColor: color + '20',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        display: false
                    },
                    y: {
                        beginAtZero: true
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                },
                animation: {
                    duration: 0
                }
            }
        });

        this.charts[canvasId] = chart;
    }

    updateCharts() {
        if (!this.charts || Object.keys(this.charts).length === 0) return;

        const timestamp = Date.now();
        
        // Update each chart with current telemetry data
        this.updateChartData('altitudeChart', this.telemetryData.altitude);
        this.updateChartData('batteryChart', this.telemetryData.batteryLevel);
        this.updateChartData('speedChart', this.telemetryData.groundSpeed);
        this.updateChartData('temperatureChart', this.telemetryData.payloadTemp);
    }

    updateChartData(chartId, value) {
        const chart = this.charts[chartId];
        if (!chart) return;

        const data = chart.data.datasets[0].data;
        data.shift(); // Remove first element
        data.push(value); // Add new element
        
        chart.update('none');
    }

    centerMapView() {
        // Center the map view on the drone
        this.addLogEntry('info', 'Map view centered on drone position');
    }

    toggleFollowDrone() {
        // Toggle follow drone mode
        this.addLogEntry('info', 'Follow drone mode toggled');
    }

    addLogEntry(level, message) {
        const logContainer = document.getElementById('logContainer');
        if (!logContainer) return;

        const timestamp = new Date().toLocaleTimeString();
        const entry = document.createElement('div');
        entry.className = 'log-entry';
        entry.innerHTML = `
            <span class="log-timestamp">${timestamp}</span>
            <span class="log-level log-level--${level}">${level.toUpperCase()}</span>
            <span class="log-message">${message}</span>
        `;

        logContainer.insertBefore(entry, logContainer.firstChild);

        // Keep only last 100 entries
        const entries = logContainer.children;
        if (entries.length > 100) {
            logContainer.removeChild(entries[entries.length - 1]);
        }
    }

    clearLog() {
        const logContainer = document.getElementById('logContainer');
        if (logContainer) {
            logContainer.innerHTML = '';
        }
        this.addLogEntry('info', 'Log cleared');
    }

    exportLog() {
        const entries = document.querySelectorAll('.log-entry');
        let logData = 'Life-Line Air Drone Mission Log\n';
        logData += '=====================================\n\n';
        
        entries.forEach(entry => {
            const timestamp = entry.querySelector('.log-timestamp').textContent;
            const level = entry.querySelector('.log-level').textContent;
            const message = entry.querySelector('.log-message').textContent;
            logData += `[${timestamp}] ${level}: ${message}\n`;
        });

        const blob = new Blob([logData], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `lifeline-air-mission-log-${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.addLogEntry('info', 'Mission log exported successfully');
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.droneDemo = new DroneDemo();
});

// Start telemetry updates every 2 seconds for charts
setInterval(() => {
    if (window.droneDemo && window.droneDemo.missionActive && !window.droneDemo.missionPaused) {
        window.droneDemo.updateCharts();
    }
}, 2000);
// Performance monitoring and optimization module
class PerformanceMonitor {
    constructor() {
        this.metrics = {
            updateTimes: [],
            averageUpdateTime: 0,
            lastUpdateTime: 0,
            updateCount: 0
        };
        this.thresholds = {
            warning: 1500, // ms - increased threshold
            critical: 3000 // ms - increased threshold
        };
        this.isRealTimeEnabled = false;
        this.debounceTimeout = null;
        this.debounceDelay = 2000; // ms - increased delay
        
        // Smart debouncing
        this.lastUpdateTimestamp = 0;
        this.minUpdateGap = 1000; // Minimum 1 second between updates
        this.pendingChanges = new Set();
        this.lastFieldValues = new Map();
        
        // Batch processing
        this.batchTimeout = null;
        this.batchDelay = 2000; // Process batches every 2 seconds
        this.changeQueue = [];
        
        // Caching system
        this.narrativeCache = new Map();
        this.cacheTimeout = 30000; // Cache entries expire after 30 seconds
    }

    // Initialize performance monitoring
    init() {
        this.createPerformanceUI();
        this.createRealTimeToggles();
        this.attachEventListeners();
    }

    // Create performance monitoring UI
    createPerformanceUI() {
        const metricsContainer = document.createElement('div');
        metricsContainer.id = 'performance-metrics';
        metricsContainer.innerHTML = `
            <div class="metrics-header">Performance Metrics</div>
            <div class="metrics-content">
                <div>Average Update Time: <span id="avg-update-time">0</span> ms</div>
                <div>Last Update Time: <span id="last-update-time">0</span> ms</div>
                <div>Total Updates: <span id="update-count">0</span></div>
            </div>
        `;
        
        // Add after the narrative output section
        const outputSection = document.getElementById('output-section');
        outputSection.parentNode.insertBefore(metricsContainer, outputSection.nextSibling);
    }

    // Create real-time toggle controls
    createRealTimeToggles() {
        // Top toggle
        const topToggle = document.createElement('div');
        topToggle.className = 'real-time-toggle top-toggle';
        topToggle.innerHTML = `
            <label class="toggle-switch">
                <input type="checkbox" id="real-time-toggle-top">
                <span class="toggle-slider"></span>
            </label>
            <span>Real-time Updates</span>
            <div class="update-notification">Narrative updates every 2 seconds</div>
        `;
        
        // Bottom toggle
        const bottomToggle = document.createElement('div');
        bottomToggle.className = 'real-time-toggle bottom-toggle';
        bottomToggle.innerHTML = `
            <label class="toggle-switch">
                <input type="checkbox" id="real-time-toggle-bottom">
                <span class="toggle-slider"></span>
            </label>
            <span>Real-time Updates</span>
            <div class="update-notification">Narrative updates every 2 seconds</div>
        `;

        // Insert toggles
        const form = document.getElementById('narrative-form');
        form.insertBefore(topToggle, form.firstChild);
        document.querySelector('.form-actions').appendChild(bottomToggle);
    }

    // Update toggle state and visual feedback
    updateToggleState() {
        const form = document.getElementById('narrative-form');
        const notifications = document.querySelectorAll('.update-notification');
        
        if (this.isRealTimeEnabled) {
            form.classList.add('real-time-enabled');
            notifications.forEach(notification => {
                notification.classList.add('visible');
            });
        } else {
            form.classList.remove('real-time-enabled');
            notifications.forEach(notification => {
                notification.classList.remove('visible');
            });
        }
    }

    // Attach event listeners
    attachEventListeners() {
        const topToggle = document.getElementById('real-time-toggle-top');
        const bottomToggle = document.getElementById('real-time-toggle-bottom');
        const form = document.getElementById('narrative-form');

        const syncToggles = (checked) => {
            this.isRealTimeEnabled = checked;
            topToggle.checked = checked;
            bottomToggle.checked = checked;
            this.updateToggleState();
            
            // Clear caches and queues when disabling
            if (!checked) {
                this.pendingChanges.clear();
                this.narrativeCache.clear();
                this.lastFieldValues.clear();
                clearTimeout(this.batchTimeout);
                clearTimeout(this.debounceTimeout);
            }
        };

        // Sync both toggles
        topToggle.addEventListener('change', (e) => syncToggles(e.target.checked));
        bottomToggle.addEventListener('change', (e) => syncToggles(e.target.checked));

        // Add field change monitoring
        const formFields = form.querySelectorAll('input, select, textarea');
        formFields.forEach(field => {
            // Determine which events to listen for based on field type
            const events = [];
            if (field.tagName === 'SELECT' || field.type === 'radio' || field.type === 'checkbox') {
                events.push('change');
            } else {
                events.push('input', 'change');
            }

            // Add event listeners
            events.forEach(eventType => {
                field.addEventListener(eventType, () => {
                    if (!this.isRealTimeEnabled) return;

                    // For radio buttons, only process if checked
                    if (field.type === 'radio' && !field.checked) return;

                    // Always process for other field types
                    this.debounce(() => {
                        const formData = new FormData(form);
                        const data = Object.fromEntries(formData.entries());
                        
                        if (data['call-status'] === 'cancelled') {
                            window.generateCancellationNarrative(data).then(narrative => {
                                document.getElementById('narrative-text').value = narrative;
                                document.getElementById('output-section').classList.remove('hidden');
                            });
                        } else {
                            window.generateNarrative(data).then(narrative => {
                                document.getElementById('narrative-text').value = narrative;
                                document.getElementById('output-section').classList.remove('hidden');
                            });
                        }
                    });
                });
            });
        });
    }

    // Update performance metrics
    updateMetrics(updateTime) {
        this.metrics.updateTimes.push(updateTime);
        if (this.metrics.updateTimes.length > 50) {
            this.metrics.updateTimes.shift(); // Keep last 50 updates
        }
        
        this.metrics.lastUpdateTime = updateTime;
        this.metrics.updateCount++;
        this.metrics.averageUpdateTime = this.metrics.updateTimes.reduce((a, b) => a + b) / this.metrics.updateTimes.length;

        // Update UI
        document.getElementById('avg-update-time').textContent = Math.round(this.metrics.averageUpdateTime);
        document.getElementById('last-update-time').textContent = Math.round(this.metrics.lastUpdateTime);
        document.getElementById('update-count').textContent = this.metrics.updateCount;

        // Check performance thresholds
        this.checkPerformance();
    }

    // Check performance against thresholds
    checkPerformance() {
        const avgTime = this.metrics.averageUpdateTime;
        const narrativeForm = document.getElementById('narrative-form');
        
        if (avgTime > this.thresholds.critical) {
            this.showPerformanceWarning('Critical performance issue detected. Disabling real-time updates.');
            this.disableRealTimeUpdates();
        } else if (avgTime > this.thresholds.warning) {
            this.showPerformanceWarning('Performance warning: Updates taking longer than expected');
        }
    }

    // Show performance warning
    showPerformanceWarning(message) {
        const warningDiv = document.createElement('div');
        warningDiv.className = 'performance-warning';
        warningDiv.textContent = message;
        
        // Remove existing warning if present
        const existingWarning = document.querySelector('.performance-warning');
        if (existingWarning) {
            existingWarning.remove();
        }
        
        document.getElementById('performance-metrics').appendChild(warningDiv);
        setTimeout(() => warningDiv.remove(), 5000);
    }

    // Disable real-time updates
    disableRealTimeUpdates() {
        this.isRealTimeEnabled = false;
        document.getElementById('real-time-toggle-top').checked = false;
        document.getElementById('real-time-toggle-bottom').checked = false;
        this.updateToggleState();
    }

    // Update toggle state and visual feedback
    updateToggleState() {
        const form = document.getElementById('narrative-form');
        const notifications = document.querySelectorAll('.update-notification');
        
        if (this.isRealTimeEnabled) {
            form.classList.add('real-time-enabled');
            notifications.forEach(notification => {
                notification.classList.add('visible');
            });
        } else {
            form.classList.remove('real-time-enabled');
            notifications.forEach(notification => {
                notification.classList.remove('visible');
            });
        }
    }

    // Enhanced debounce function with smart debouncing and batching
    debounce(callback) {
        if (!this.isRealTimeEnabled) {
            return;
        }

        const now = performance.now();
        const timeSinceLastUpdate = now - this.lastUpdateTimestamp;

        // Add callback to pending changes
        this.pendingChanges.add(callback);

        // Clear existing timeouts
        clearTimeout(this.debounceTimeout);
        clearTimeout(this.batchTimeout);

        // Check if we should process now or wait
        if (timeSinceLastUpdate >= this.minUpdateGap) {
            this.processBatch();
        } else {
            // Schedule batch processing
            this.batchTimeout = setTimeout(() => {
                this.processBatch();
            }, this.batchDelay);
        }
    }

    // Process batched changes
    async processBatch() {
        if (this.pendingChanges.size === 0) return;

        const startTime = performance.now();
        this.lastUpdateTimestamp = startTime;

        try {
            // Get form data for cache key
            const form = document.getElementById('narrative-form');
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());
            const cacheKey = JSON.stringify(data);

            // Check cache
            const cachedNarrative = this.narrativeCache.get(cacheKey);
            if (cachedNarrative) {
                document.getElementById('narrative-text').value = cachedNarrative;
                return;
            }

            // Process all pending changes
            const callbacks = Array.from(this.pendingChanges);
            for (const callback of callbacks) {
                await callback();
            }

            // Cache the result
            const narrative = document.getElementById('narrative-text').value;
            this.narrativeCache.set(cacheKey, narrative);
            setTimeout(() => {
                this.narrativeCache.delete(cacheKey);
            }, this.cacheTimeout);

            // Clear pending changes
            this.pendingChanges.clear();

            // Update metrics
            const endTime = performance.now();
            this.updateMetrics(endTime - startTime);
        } catch (error) {
            console.error('Error processing batch:', error);
            this.pendingChanges.clear();
        }
    }

    // Check if field value has changed significantly
    hasSignificantChange(fieldName, newValue) {
        const oldValue = this.lastFieldValues.get(fieldName);
        if (oldValue === newValue) return false;
        this.lastFieldValues.set(fieldName, newValue);
        return true;
    }
}

// Export singleton instance
window.performanceMonitor = new PerformanceMonitor();

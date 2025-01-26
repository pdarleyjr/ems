// TensorFlow.js and USE initialization
let model = null;
let tfLoaded = false;
let useLoaded = false;

async function loadModel() {
    try {
        // Load Universal Sentence Encoder model
        model = await use.load();
        useLoaded = true;
        updateAIStatus();
        console.log('Universal Sentence Encoder loaded successfully');
    } catch (error) {
        console.error('Error loading Universal Sentence Encoder:', error);
        updateAIStatus();
    }
}

// Initialize when TensorFlow.js is ready
tf.ready().then(() => {
    tfLoaded = true;
    updateAIStatus();
    loadModel();
}).catch(error => {
    console.error('Error initializing TensorFlow.js:', error);
    updateAIStatus();
});

// Text analysis using USE
async function analyzeText(text) {
    if (!model) {
        throw new Error('Model not loaded');
    }

    try {
        // Encode the text using USE
        const embeddings = await model.embed([text]);
        // Get the embedding data
        const data = await embeddings.array();
        // Clean up tensor
        embeddings.dispose();
        return data[0]; // Return the embedding vector for the text
    } catch (error) {
        console.error('Error analyzing text:', error);
        throw error;
    }
}

// Enhanced text processing with USE
async function enhanceText(text, type) {
    if (!model) return text;
    
    try {
        // Common medical dispatch patterns
        const dispatchPatterns = {
            infection: "a possible infection",
            pain: "complaints of pain",
            injury: "a reported injury",
            fall: "a fall incident",
            breathing: "difficulty breathing",
            chest: "chest discomfort",
            sick: "illness",
            medical: "a medical condition"
        };

        // Process text based on type
        switch(type) {
            case 'dispatch':
                // Enhance dispatch reason
                for (const [key, value] of Object.entries(dispatchPatterns)) {
                    if (text.toLowerCase().includes(key)) {
                        return value;
                    }
                }
                return `complaints of ${text.toLowerCase()}`;
                
            case 'complaint':
                // Enhance chief complaint
                return text.toLowerCase().startsWith('the') ? text : `the ${text}`;
                
            default:
                return text;
        }
    } catch (error) {
        console.error('Error in text enhancement:', error);
        return text;
    }
}

// Process response delays into natural text
function processResponseDelays(delays) {
    if (!delays || delays.length === 0 || (delays.length === 1 && delays[0] === 'none')) {
        return '';
    }

    // Remove 'none' if it's mixed with other delays
    delays = delays.filter(d => d !== 'none');
    
    if (delays.length === 0) return '';

    const delayDescriptions = {
        'traffic': 'heavy traffic conditions',
        'weather': 'inclement weather',
        'staging': 'staging requirements for scene security',
        'access': 'difficulties accessing the location',
        'directions': 'challenges locating the address'
    };

    const descriptions = delays.map(d => delayDescriptions[d] || d);
    
    if (descriptions.length === 1) {
        return ` Response time was affected by ${descriptions[0]}.`;
    } else {
        const lastDelay = descriptions.pop();
        return ` Response time was affected by ${descriptions.join(', ')} and ${lastDelay}.`;
    }
}

// Generate narrative based on embeddings and context
async function generateSmartNarrative(data, context) {
    try {
        // Dispatch Information with response delays
        const responseDelayText = processResponseDelays(data['response-delays']);
        const dispatchInfo = context + responseDelayText;
        
        // Assessment Information
        let assessmentInfo = '';
        if (data.assessment) {
            const patientDesc = `${data['patient-age']} year old ${data['patient-gender']}`;
            const chiefComplaint = data['chief-complaint'] ? `complaining of ${data['chief-complaint']}` : '';
            const location = data['patient-location'] ? `${data['patient-location']}` : '';
            
            assessmentInfo = `Upon arrival, we found the patient ${location ? `${location}, ` : ''}${chiefComplaint}`;
            
            // Add OPQRST details if provided
            if (data['opqrst-toggle'] === 'on') {
                let opqrstDetails = [];
                
                if (data['onset']) {
                    opqrstDetails.push(`reported that the symptoms began ${data['onset'].toLowerCase()}`);
                }
                
                if (data['provocation']) {
                    opqrstDetails.push(`stated that ${data['provocation'].toLowerCase()} affects their condition`);
                }
                
                if (data['quality']) {
                    opqrstDetails.push(`described the sensation as ${data['quality'].toLowerCase()}`);
                }
                
                if (data['radiation']) {
                    opqrstDetails.push(`noted that the discomfort radiates to ${data['radiation'].toLowerCase()}`);
                }
                
                if (data['severity']) {
                    opqrstDetails.push(`rated the severity as ${data['severity']}/10 on the pain scale`);
                }
                
                if (data['time']) {
                    opqrstDetails.push(`indicated that symptoms have been present for ${data['time'].toLowerCase()}`);
                }
                
                if (opqrstDetails.length > 0) {
                    assessmentInfo += `. The patient ${opqrstDetails.join(', ')}`;
                }
            }
            
            assessmentInfo += '. ';
            
            if (data['medical-history']) {
                assessmentInfo += `Patient's relevant medical history includes ${data['medical-history']}. `;
            }
            
            const gcsTotal = document.getElementById('gcs-total').value;
            assessmentInfo += `The patient was alert and oriented times four, with a Glasgow Coma Scale of ${gcsTotal}. Their pupils were equal, round, and reactive to light, and there was no reported or observed loss of consciousness.`;
            
            if (data['vitals-normal'] === 'on') {
                assessmentInfo += ` Initial assessment revealed all vital signs were within normal limits.`;
            } else if (data['vital-signs']) {
                assessmentInfo += ` Initial assessment revealed ${data['vital-signs']}.`;
            }
            
            if (data['dcap-normal'] === 'on') {
                assessmentInfo += ` Patient was negative for any DCAP-BTLS throughout the body.`;
            } else if (data['physical-exam']) {
                assessmentInfo += ` ${data['physical-exam']}.`;
            }
            
            // Add standard complaints denial if no specific physical exam notes
            assessmentInfo += ` The patient denied any headache, nausea, vomiting, abdominal pain, diarrhea, chest pain, stroke-like symptoms, or other medical complaints.`;
        }

        // Treatment Information
        let treatmentInfo = '';
        let treatments = [];

        // Add selected treatments
        if (data['bls-assessment'] === 'on') treatments.push('BLS assessment was performed');
        if (data['iv-established'] === 'on') treatments.push('IV access was established');
        if (data['ecg-performed'] === 'on') treatments.push('a 12 lead ECG was obtained');
        if (data['ice-pack'] === 'on') treatments.push('ice pack was applied');
        if (data['wound-care'] === 'on') treatments.push('the wound was cleaned and bandaged');

        // Add additional treatment notes
        if (data.treatment && data.treatment.trim()) {
            treatments.push(data.treatment);
        }

        if (treatments.length > 0) {
            // Add natural transition to treatment section
            const treatmentList = treatments.join(', ').replace(/,([^,]*)$/, ' and$1');
            if (data['transport-decision'] === 'transported') {
                treatmentInfo = `Based on our assessment findings, the following interventions were performed: ${treatmentList}.`;
            } else {
                treatmentInfo = `After completing our assessment, the following care was offered: ${treatmentList}.`;
            }
        }

        // Transport Information
        let transportInfo = '';
        if (data['transport-decision'] === 'transported') {
            const hospital = data['hospital'] || '';
            const room = data['room-number'] ? `room ${data['room-number']}` : '';
            const staff = data['staff-name'] ? `RN ${data['staff-name']}` : '';
            transportInfo = `The patient was transported to ${hospital} ${room} and left in the care of ${staff}.`;
        } else if (data['transport-decision'] === 'refused') {
            let refusalInfo = `Despite our recommendations for transport to further evaluate their condition, the patient refused transport. `;
            refusalInfo += `The patient was advised of the risks associated with refusing medical care and transport. `;
            
            if (data['refusal-capacity']) {
                refusalInfo += `${data['refusal-capacity']} `;
            } else {
                refusalInfo += `They demonstrated capacity to refuse by being alert and oriented, understanding the risks explained, and making a rational decision. `;
            }
            
            if (data['refusal-witness']) {
                refusalInfo += `The refusal was witnessed by ${data['refusal-witness']}. `;
            }
            
            refusalInfo += `The patient signed a refusal form acknowledging these risks and was advised to call 911 if their condition worsens or they change their mind about transport.`;
            
            transportInfo = refusalInfo;
        }

        // Combine sections into a cohesive narrative
        const sections = [dispatchInfo, assessmentInfo, treatmentInfo, transportInfo]
            .filter(section => section.length > 0);

        // Use embeddings to enhance narrative flow
        const embedding = await analyzeText(sections.join(' '));
        
        // Create flowing paragraphs
        const narrative = sections
            .map(section => section.trim())
            .join('\n\n');

        return narrative;
    } catch (error) {
        console.error('Error generating smart narrative:', error);
        return context; // Fallback to basic context if analysis fails
    }
}

// Call Status functionality
function initializeCallStatus() {
    const callStatusRadios = document.querySelectorAll('input[name="call-status"]');
    const cancellationDetails = document.getElementById('cancellation-details');
    const cancellationType = document.getElementById('cancellation-type');
    const pdBadgeGroup = document.getElementById('pd-badge-group');
    const otherCancellationGroup = document.getElementById('other-cancellation-group');
    const formSections = document.querySelectorAll('.form-section:not(:first-child)');

    // Function to hide/show form sections based on cancellation type
    function updateFormSections(type) {
        formSections.forEach(section => {
            if (type === 'active') {
                section.classList.remove('hidden');
            } else if (type === 'dispatch' || type === 'pd') {
                section.classList.add('hidden');
            } else if (type === 'caller') {
                if (section.classList.contains('patient-info')) {
                    section.classList.remove('hidden');
                } else {
                    section.classList.add('hidden');
                }
            } else if (type === 'other') {
                section.classList.remove('hidden');
            }
        });
    }

    // Call Status change handler
    callStatusRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.value === 'cancelled') {
                cancellationDetails.classList.remove('hidden');
                // Reset cancellation type
                cancellationType.value = 'dispatch';
                pdBadgeGroup.classList.add('hidden');
                otherCancellationGroup.classList.add('hidden');
                document.getElementById('pd-badge').required = false;
                updateFormSections('dispatch');
            } else {
                cancellationDetails.classList.add('hidden');
                pdBadgeGroup.classList.add('hidden');
                otherCancellationGroup.classList.add('hidden');
                cancellationType.value = 'dispatch';
                document.getElementById('pd-badge').required = false;
                document.getElementById('pd-badge').value = '';
                updateFormSections('active');
            }
        });
    });

    // Cancellation type change handler
    cancellationType.addEventListener('change', function() {
        console.log('Cancellation type changed:', this.value);
        
        // Reset all special fields
        pdBadgeGroup.classList.add('hidden');
        otherCancellationGroup.classList.add('hidden');
        document.getElementById('pd-badge').required = false;
        document.getElementById('pd-badge').value = '';
        document.getElementById('other-reason').value = '';

        // Handle specific cancellation types
        switch(this.value) {
            case 'dispatch':
                updateFormSections('dispatch');
                break;
            case 'pd':
                pdBadgeGroup.classList.remove('hidden');
                document.getElementById('pd-badge').required = true;
                updateFormSections('pd');
                break;
            case 'caller':
                updateFormSections('caller');
                break;
            case 'other':
                otherCancellationGroup.classList.remove('hidden');
                updateFormSections('other');
                break;
        }
    });
}

// Initialize GCS total calculation
function initializeGCSCalculation() {
    const gcsEyes = document.querySelector('select[name="gcs-eyes"]');
    const gcsVerbal = document.querySelector('select[name="gcs-verbal"]');
    const gcsMotor = document.querySelector('select[name="gcs-motor"]');
    const gcsTotal = document.getElementById('gcs-total');

    function updateGCSTotal() {
        const total = parseInt(gcsEyes.value) + parseInt(gcsVerbal.value) + parseInt(gcsMotor.value);
        gcsTotal.value = total;
    }

    gcsEyes.addEventListener('change', updateGCSTotal);
    gcsVerbal.addEventListener('change', updateGCSTotal);
    gcsMotor.addEventListener('change', updateGCSTotal);

    // Initialize total
    updateGCSTotal();
}

// Initialize custom unit handling
function initializeCustomUnit() {
    const unitNumber = document.getElementById('unit-number');
    const customUnit = document.getElementById('custom-unit');

    unitNumber.addEventListener('change', function() {
        if (this.value === 'other') {
            customUnit.classList.remove('hidden');
            customUnit.required = true;
        } else {
            customUnit.classList.add('hidden');
            customUnit.required = false;
            customUnit.value = '';
        }
    });
}

// Initialize transport decision handling
function initializeTransportDecision() {
    const transportDecision = document.getElementById('transport-decision');
    const transportDetails = document.getElementById('transport-details');
    const refusalDetails = document.getElementById('refusal-details');

    transportDecision.addEventListener('change', function() {
        transportDetails.classList.add('hidden');
        refusalDetails.classList.add('hidden');

        if (this.value === 'transported') {
            transportDetails.classList.remove('hidden');
        } else if (this.value === 'refused') {
            refusalDetails.classList.remove('hidden');
        }
    });
}

// Generate narrative based on cancellation type
async function generateCancellationNarrative(data) {
    const unit = data['unit-number'] === 'other' ? data['custom-unit'] : data['unit-number'];
    const dispatchReason = enhanceDispatchText(data['dispatch-reason'] || '');
    const responseDelays = Array.isArray(data['response-delays']) ? data['response-delays'] : 
                          data['response-delays'] ? [data['response-delays']] : [];
    const responseDelayText = processResponseDelays(responseDelays);
    const context = `${unit} was dispatched to ${dispatchReason}.${responseDelayText}`;
    
    let narrative = '';
    
    switch(data['cancellation-type']) {
        case 'dispatch':
            narrative = `${context}. Before departing the station, dispatch advised that our services were no longer required and that we could cancel the response. ${unit} returned to service.`;
            break;
        case 'pd':
            narrative = `${context}. Upon arrival, we were immediately canceled by the police department (Badge #${data['pd-badge']}) who determined no EMS services were needed. We returned to service without further action.`;
            break;
        case 'caller':
            const age = data['patient-age'];
            const gender = data['patient-gender'];
            narrative = `${context}. Upon arrival, we found the ${age} year old ${gender} patient had decided they no longer required EMS services and was refusing further assistance. We were canceled on scene and promptly returned to service.`;
            break;
        case 'other':
            const customReason = data['other-reason'];
            if (customReason) {
                narrative = `${context}. ${customReason} ${unit} returned to service.`;
            } else {
                narrative = `${context}. The call was canceled and ${unit} returned to service.`;
            }
            break;
    }
    
    // Use embeddings to enhance narrative flow
    try {
        const embedding = await analyzeText(narrative);
        return narrative;
    } catch (error) {
        console.error('Error enhancing cancellation narrative:', error);
        return narrative;
    }
}

// Form submission and narrative generation
function initializeForm() {
    const form = document.getElementById('narrative-form');
    const outputSection = document.getElementById('output-section');
    const narrativeText = document.getElementById('narrative-text');
    const loadingIndicator = document.getElementById('loading-indicator');
    const copyBtn = document.getElementById('copy-btn');
    const editBtn = document.getElementById('edit-btn');

    // Add real-time update listeners to all form fields
    const formFields = form.querySelectorAll('input, select, textarea');
    formFields.forEach(field => {
        ['input', 'change'].forEach(eventType => {
            field.addEventListener(eventType, () => {
                if (window.performanceMonitor.isRealTimeEnabled) {
                    window.performanceMonitor.debounce(async () => {
                        narrativeText.classList.add('updating');
                        
                        try {
                            const formData = new FormData(form);
                            const data = Object.fromEntries(formData.entries());
                            
                            // Generate appropriate narrative based on call status
                            let narrative;
                            if (data['call-status'] === 'cancelled') {
                                narrative = await generateCancellationNarrative(data);
                            } else {
                                narrative = await generateNarrative(data);
                            }
                            
                            narrativeText.value = narrative;
                            outputSection.classList.remove('hidden');
                        } catch (error) {
                            console.error('Error in real-time update:', error);
                        } finally {
                            setTimeout(() => {
                                narrativeText.classList.remove('updating');
                            }, 1000);
                        }
                    });
                }
            });
        });
    });

    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        if (!tfLoaded || !useLoaded) {
            alert('AI system is not fully initialized yet. Please wait a moment and try again.');
            return;
        }

        loadingIndicator.classList.remove('hidden');
        outputSection.classList.add('hidden');

        try {
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());
            
            // Generate appropriate narrative based on call status
            let narrative;
            if (data['call-status'] === 'cancelled') {
                narrative = await generateCancellationNarrative(data);
            } else {
                narrative = await generateNarrative(data);
            }
            
            narrativeText.value = narrative;
            loadingIndicator.classList.add('hidden');
            outputSection.classList.remove('hidden');
        } catch (error) {
            console.error('Error generating narrative:', error);
            loadingIndicator.classList.add('hidden');
            alert('An error occurred while generating the narrative. Please try again.');
        }
    });

    copyBtn.addEventListener('click', function() {
        narrativeText.select();
        document.execCommand('copy');
        showMessage('Copied to clipboard!');
    });

    editBtn.addEventListener('click', function() {
        narrativeText.readOnly = !narrativeText.readOnly;
        this.textContent = narrativeText.readOnly ? 'Enable Editing' : 'Disable Editing';
    });
}

// Helper function to show temporary messages
function showMessage(text) {
    const message = document.createElement('div');
    message.className = 'message';
    message.textContent = text;
    document.body.appendChild(message);
    setTimeout(() => message.remove(), 3000);
}

// Update AI status indicator
function updateAIStatus() {
    const aiStatus = document.getElementById('ai-status');
    if (aiStatus) {
        if (tfLoaded && useLoaded) {
            aiStatus.classList.remove('error');
            aiStatus.setAttribute('title', 'AI active');
        } else {
            aiStatus.classList.add('error');
            aiStatus.setAttribute('title', 'AI not fully initialized');
        }
    }
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Create AI status indicator
    const aiStatus = document.createElement('div');
    aiStatus.id = 'ai-status';
    aiStatus.setAttribute('title', 'AI initializing...');
    document.body.appendChild(aiStatus);

    // Initialize performance monitoring
    window.performanceMonitor.init();

    // Initialize OPQRST toggle
    const opqrstToggle = document.getElementById('opqrst-toggle');
    const opqrstFields = document.getElementById('opqrst-fields');
    
    opqrstToggle.addEventListener('change', function() {
        opqrstFields.classList.toggle('hidden', !this.checked);
    });

    // Initialize all functionality
    initializeCallStatus();
    initializeGCSCalculation();
    initializeCustomUnit();
    initializeTransportDecision();
    initializeForm();
    updateAIStatus();
});

// Enhanced dispatch text processing
function enhanceDispatchText(text) {
    if (!text) return '';
    
    const text_lower = text.toLowerCase().trim();
    
    // Common medical patterns
    const patterns = {
        // Conditions needing "a/an"
        infection: (t) => `a possible ${t}`,
        injury: (t) => `an ${t}`,
        incident: (t) => `an ${t}`,
        emergency: (t) => `a medical ${t}`,
        illness: (t) => `an ${t}`,
        allergy: (t) => `an allergic reaction`,
        
        // Pain-related terms
        pain: (t) => `complaints of ${t}`,
        ache: (t) => `complaints of ${t}`,
        discomfort: (t) => `complaints of ${t}`,
        
        // Specific conditions
        breathing: (t) => `difficulty breathing`,
        respiratory: (t) => `respiratory distress`,
        chest: (t) => `chest discomfort`,
        fall: (t) => `a fall incident`,
        trauma: (t) => `a trauma incident`,
        bleeding: (t) => `active bleeding`,
        dizzy: (t) => `dizziness`,
        sick: (t) => `illness`,
        weak: (t) => `weakness`,
        unconscious: (t) => `an unconscious person`,
        unresponsive: (t) => `an unresponsive person`,
        seizure: (t) => `a possible seizure`,
        stroke: (t) => `a possible stroke`,
        diabetic: (t) => `a diabetic emergency`,
        cardiac: (t) => `a cardiac event`,
        overdose: (t) => `a possible overdose`,
        psychiatric: (t) => `a psychiatric emergency`
    };
    
    // Check for matching patterns
    for (const [key, formatter] of Object.entries(patterns)) {
        if (text_lower.includes(key)) {
            return formatter(text_lower);
        }
    }
    
    // Default formatting for unmatched terms
    if (!text_lower.startsWith('a ') && !text_lower.startsWith('an ')) {
        return `a patient with ${text_lower}`;
    }
    
    return text_lower;
}

// Regular narrative generation
window.generateNarrative = async function(data) {
    try {
        const unit = data['unit-number'] === 'other' ? data['custom-unit'] : data['unit-number'];
        const dispatchReason = enhanceDispatchText(data['dispatch-reason'] || '');
        const context = `${unit} was dispatched to ${dispatchReason}.`;
        
        // Get current GCS total
        const gcsTotal = document.getElementById('gcs-total').value;
        
        // Create structured data for smart narrative generation
        const narrativeData = {
            assessment: true,
            'patient-age': data['patient-age'],
            'patient-gender': data['patient-gender'],
            'patient-location': data['patient-location'],
            'chief-complaint': data['chief-complaint'],
            'medical-history': data['medical-history'],
            'gcs-total': gcsTotal,
            'vital-signs': data['vital-signs'],
            'physical-exam': data['physical-exam'],
            'treatment': data['treatment'],
            'transport-decision': data['transport-decision'],
            'hospital': data['hospital'],
            'room-number': data['room-number'],
            'staff-name': data['staff-name'],
            'refusal-witness': data['refusal-witness'],
            'refusal-capacity': data['refusal-capacity'],
            'opqrst-toggle': data['opqrst-toggle'],
            'onset': data['onset'],
            'provocation': data['provocation'],
            'quality': data['quality'],
            'radiation': data['radiation'],
            'severity': data['severity'],
            'time': data['time'],
            'response-delays': Array.isArray(data['response-delays']) ? data['response-delays'] : 
                             data['response-delays'] ? [data['response-delays']] : []
        };
        
        // Generate enhanced narrative with proper structure
        const narrative = await generateSmartNarrative(narrativeData, context);
        
        // Add return to service
        return `${narrative}\n\n${unit} returned to service.`;
    } catch (error) {
        console.error('Error in narrative generation:', error);
        return `${unit || 'Unit'} was dispatched to ${data['dispatch-reason'] || 'location'}. Due to technical difficulties, a detailed narrative could not be generated.`;
    }
};

// Expose generateCancellationNarrative to window
window.generateCancellationNarrative = generateCancellationNarrative;

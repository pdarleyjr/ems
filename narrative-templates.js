// Enhanced Narrative Templates Module
const templates = {
    // Expanded Dispatch Templates
    dispatch: {
        standard: (data) => 
            `${data.unit} was dispatched to a call for a ${data.age}-year-old ${data.gender} complaining of ${data.dispatchDesc}.`,
        withNotes: (data) => 
            `${data.unit} was dispatched to a call for a ${data.age}-year-old ${data.gender} complaining of ${data.dispatchDesc}. ${data.dispatchNotes}`,
        policeAssist: (data) =>
            `${data.unit} was dispatched to a medical call at the request of ${data.requestingAgency}.`,
        limitedInfo: (data) =>
            `${data.unit} was dispatched to a medical call with limited information available.`,
        canceledEnRoute: (data) =>
            `${data.unit} was dispatched but was canceled en route.`,
        fallResponse: (data) =>
            `${data.unit} was dispatched to a call for a ${data.age}-year-old ${data.gender} who had fallen.`,
        chestPainResponse: (data) => {
            let response = [];
            
            response.push(`${data.unit} was dispatched to a reported case of severe chest pain at ${data.location}.`);
            
            if (data.history) {
                response.push(`The patient has a history of ${data.history}.`);
            }
            
            if (data.riskFactors) {
                response.push(`Identified cardiac risk factors include: ${data.riskFactors}.`);
            }
            
            if (data.onset) {
                response.push(`The pain began ${data.onset}.`);
            }
            
            if (data.quality) {
                response.push(`The patient described the pain as ${data.quality}.`);
            }
            
            if (data.radiation) {
                response.push(`The pain radiates to ${data.radiation}.`);
            }
            
            if (data.associatedSymptoms) {
                response.push(`Associated symptoms include: ${data.associatedSymptoms}.`);
            }
            
            if (data.medications) {
                response.push(`Current cardiac medications include: ${data.medications}.`);
            }
            
            return response.join(' ');
        },
        mentalHealthResponse: (data) => {
            let response = [];
            
            response.push(`${data.unit} was dispatched to a call for a ${data.age}-year-old ${data.gender} experiencing ${data.symptoms}.`);
            
            if (data.history) {
                response.push(`The patient has a history of ${data.history}.`);
            }
            
            if (data.medications) {
                response.push(`Current medications include: ${data.medications}.`);
            }
            
            if (data.riskFactors) {
                response.push(`Identified risk factors include: ${data.riskFactors}.`);
            }
            
            if (data.safetyConcerns) {
                response.push(`Safety concerns noted: ${data.safetyConcerns}.`);
            }
            
            if (data.supportSystem) {
                response.push(`The patient reports having ${data.supportSystem} as a support system.`);
            }
            
            if (data.recentEvents) {
                response.push(`Recent significant events include: ${data.recentEvents}.`);
            }
            
            if (data.legalStatus) {
                response.push(`The patient's legal status is ${data.legalStatus}.`);
            }
            
            return response.join(' ');
        }
    },

    // Enhanced Response Templates
    response: {
        immediate: (data) => 
            `${data.unit} acknowledged the dispatch and proceeded immediately to the scene ${data.responseType === 'Code 3' ? 'with lights and sirens activated' : 'under normal driving conditions'}.`,
        delayed: (data) => 
            `${data.unit} acknowledged the dispatch with a ${data.responseDelay} minute delay due to ${data.responseNotes}, then proceeded to the scene ${data.responseType === 'Code 3' ? 'with lights and sirens activated' : 'under normal driving conditions'}.`,
        accessIssues: (data) =>
            `${data.unit} experienced difficulty accessing the scene due to ${data.accessIssues}.`,
        policeCancel: (data) =>
            `${data.unit} arrived on scene but was canceled by ${data.cancelingAgency} who determined no EMS services were needed.`
    },

    // Enhanced Patient Contact Templates
    patientContact: {
        standard: (data) => 
            `Upon arrival, the crew encountered a ${data.age}-year-old ${data.gender} patient who was ${data.condition.toLowerCase()}. ${data.chiefComplaint}`,
        withLocation: (data) => 
            `Upon arrival at the scene, the crew found the patient, a ${data.age}-year-old ${data.gender}, ${data.location}. The patient was ${data.condition.toLowerCase()}, presenting with ${data.chiefComplaint}`,
        refusal: (data) =>
            `Upon arrival, the patient was ${data.condition.toLowerCase()} and stated they were refusing care. ${data.refusalDetails}`,
        languageBarrier: (data) => {
            let response = [];
            response.push(`Upon arrival, the crew encountered a ${data.age}-year-old ${data.gender} patient who primarily spoke ${data.language}.`);
            
            if (data.translator) {
                response.push(`With assistance from ${data.translator},`);
            }
            
            response.push(`it was determined the patient was ${data.condition.toLowerCase()} and presenting with ${data.chiefComplaint}.`);
            
            if (data.communicationBarriers) {
                response.push(`Communication barriers noted: ${data.communicationBarriers}.`);
            }
            
            return response.join(' ');
        },
        fallAssessment: (data) =>
            `Upon arrival, we found the patient ${data.position} after a fall. The patient reported ${data.fallDetails} and denied any loss of consciousness.`,
        mentalHealthAssessment: (data) =>
            `Upon arrival, we found the patient ${data.position}. The patient reported ${data.symptoms} and appeared ${data.mentalStatus}.`
    },

    // Comprehensive Assessment Templates
    assessment: {
        full: (data) => {
            let assessment = [];
            
            // Vital Signs
            if (data.vitals) {
                assessment.push(`Initial assessment revealed the following vital signs: ${data.vitals}.`);
            }
            
            // Neurological Status
            if (data.neuro) {
                assessment.push(`Neurological assessment showed ${data.neuro.status} with GCS of ${data.neuro.gcs}.`);
            }
            
            // Physical Exam
            if (data.exam) {
                assessment.push(`Physical exam revealed: ${data.exam.findings}.`);
            }
            
            // Pain Assessment
            if (data.pain) {
                assessment.push(`The patient reported ${data.pain.level}/10 pain ${data.pain.location ? `in the ${data.pain.location}` : ''}.`);
            }
            
            // Medical History
            if (data.history) {
                assessment.push(`Medical history includes: ${data.history}.`);
            }
            
            // Pertinent Negatives
            if (data.negatives) {
                assessment.push(`The patient denied any ${data.negatives.join(', ')}.`);
            }
            
            // Common Negative Findings
            assessment.push(`The patient denied headache, nausea, vomiting, abdominal pain, diarrhea, chest pain, stroke-like symptoms, or other medical complaints.`);
            
            // Physical Findings
            assessment.push(`A full assessment revealed no deformities, contusions, abrasions, punctures, burns, tenderness, lacerations, or swelling.`);
            
            return assessment.join(' ');
        },
        
        focused: (data) => {
            return `Focused assessment revealed ${data.findings}. The patient remained ${data.condition.toLowerCase()} throughout.`;
        }
    },

    // Enhanced Treatment Templates
    treatment: {
        detailed: (data) => {
            let treatment = [];
            
            if (data.interventions) {
                treatment.push(`The following treatments were provided: ${data.interventions}.`);
            }
            
            if (data.medications) {
                treatment.push(`Medications administered included: ${data.medications}.`);
            }
            
            if (data.response) {
                treatment.push(`The patient's response to treatment was ${data.response}.`);
            }
            
            if (data.monitoring) {
                treatment.push(`Continuous monitoring included: ${data.monitoring}.`);
            }
            
            return treatment.join(' ');
        },
        
        basic: (data) => 
            `Basic life support measures were implemented including ${data.treatments}.`
    },

    // Comprehensive Transport Templates
    transport: {
        detailed: (data) => {
            let transport = [];
            
            transport.push(`Following ${data.stabilization ? 'stabilization' : 'assessment'}, ${data.unit} transported the patient to ${data.destination}.`);
            
            if (data.position) {
                transport.push(`The patient was transported in ${data.position} position.`);
            }
            
            if (data.monitoring) {
                transport.push(`During transport, the patient was continuously monitored for ${data.monitoring}.`);
            }
            
            if (data.preAlert) {
                transport.push(`The receiving facility was pre-alerted with ${data.preAlert}, ensuring the ${data.team} was ready upon arrival.`);
            }
            
            transport.push(`Upon arrival, the patient was placed in room ${data.room} and left in the care of ${data.staff}.`);
            
            return transport.join(' ');
        },
        
        refusal: (data) => {
            let refusal = [];
            
            refusal.push(`After thorough assessment and patient education, the patient refused transport.`);
            
            if (data.witness) {
                refusal.push(`The refusal was witnessed by ${data.witness}.`);
            }
            
            if (data.capacity) {
                refusal.push(`The patient demonstrated capacity to refuse care by ${data.capacity}.`);
            }
            
            if (data.instructions) {
                refusal.push(`The patient was advised to ${data.instructions}.`);
            }
            
            if (data.medicalFindings) {
                refusal.push(`Despite abnormal findings including ${data.medicalFindings}, the patient maintained their refusal.`);
            }
            
            if (data.encouragement) {
                refusal.push(`Despite encouragement from ${data.encouragement}, the patient maintained their refusal.`);
            }
            
            if (data.medicationStatus) {
                refusal.push(`The patient acknowledged ${data.medicationStatus} regarding their medications.`);
            }
            
            if (data.assessmentDetails) {
                refusal.push(`Assessment revealed: ${data.assessmentDetails}.`);
            }
            
            if (data.riskDiscussion) {
                refusal.push(`The risks of refusing care including ${data.riskDiscussion} were thoroughly explained.`);
            }
            
            if (data.bloodThinners) {
                refusal.push(`The patient ${data.bloodThinners ? 'was' : 'was not'} taking blood thinners.`);
            }
            
            if (data.fallDetails) {
                refusal.push(`Fall details: ${data.fallDetails}.`);
            }
            
            if (data.communicationBarriers) {
                refusal.push(`Communication barriers noted: ${data.communicationBarriers}.`);
            }
            
            if (data.supportSystem) {
                refusal.push(`The patient reported having ${data.supportSystem} as a support system.`);
            }
            
            return refusal.join(' ');
        },
        
        cancellation: (data) =>
            `${data.unit} was canceled on scene by ${data.cancelingAgency} who determined no EMS services were needed.`
    },

    // Enhanced Handoff Templates
    handoff: {
        standard: (data) =>
            `Upon arrival at ${data.facility}, the patient was placed in ${data.room} and left in the care of ${data.staff}.`,
        detailed: (data) =>
            `Upon arrival at ${data.facility}, the patient was placed in ${data.room}. A full report was given to ${data.staff}, including ${data.reportDetails}.`,
        critical: (data) =>
            `Upon arrival at ${data.facility}, the patient was immediately transferred to ${data.room} where the ${data.team} was standing by. A full report was given to ${data.staff} including ${data.reportDetails}.`
    }
};

// Enhanced Template Selection
function selectTemplate(section, data) {
    switch(section) {
        case 'dispatch':
            if (data.canceled) return templates.dispatch.canceledEnRoute(data);
            if (data.requestingAgency) return templates.dispatch.policeAssist(data);
            if (data.limitedInfo) return templates.dispatch.limitedInfo(data);
            return data.dispatchNotes ? templates.dispatch.withNotes(data) : templates.dispatch.standard(data);
            
        case 'response':
            if (data.canceled) return templates.response.policeCancel(data);
            if (data.accessIssues) return templates.response.accessIssues(data);
            return data.responseDelay > 0 ? templates.response.delayed(data) : templates.response.immediate(data);
            
        case 'patientContact':
            if (data.refusal) return templates.patientContact.refusal(data);
            if (data.language) return templates.patientContact.languageBarrier(data);
            return data.location ? templates.patientContact.withLocation(data) : templates.patientContact.standard(data);
            
        case 'assessment':
            return data.detailed ? templates.assessment.full(data) : templates.assessment.focused(data);
            
        case 'treatment':
            return data.detailed ? templates.treatment.detailed(data) : templates.treatment.basic(data);
            
        case 'transport':
            if (data.canceled) return templates.transport.cancellation(data);
            return data.refusal ? templates.transport.refusal(data) : templates.transport.detailed(data);
            
        case 'handoff':
            if (data.critical) return templates.handoff.critical(data);
            return data.detailed ? templates.handoff.detailed(data) : templates.handoff.standard(data);
            
        default:
            return '';
    }
}

export { templates, selectTemplate };

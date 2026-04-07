export function setupAccount() {
    if (!document.getElementById('registerForm') && !document.getElementById('loginForm')) return;

    // Password toggle
    document.querySelectorAll('.toggle-password').forEach(btn => {
        btn.addEventListener('click', () => {
            const input = document.getElementById(btn.dataset.target);
            if (!input) return;
            const isHidden = input.type === 'password';
            input.type = isHidden ? 'text' : 'password';
            const icon = btn.querySelector('i');
            icon.classList.toggle('fa-eye-slash', !isHidden);
            icon.classList.toggle('fa-eye', isHidden);
        });
    });

    // Panel switching
    document.getElementById('goToLogin')?.addEventListener('click', e => {
        e.preventDefault();
        document.getElementById('registerPanel').classList.remove('active');
        document.getElementById('loginPanel').classList.add('active');
    });

    document.getElementById('goToRegister')?.addEventListener('click', e => {
        e.preventDefault();
        document.getElementById('loginPanel').classList.remove('active');
        document.getElementById('registerPanel').classList.add('active');
    });

    // Forgot password toggle
    const forgotLink = document.getElementById('forgotPassword');
    const forgotMsg  = document.getElementById('forgotMsg');
    if (forgotLink && forgotMsg) {
        forgotLink.addEventListener('click', e => {
            e.preventDefault();
            forgotMsg.style.display = forgotMsg.style.display === 'none' ? 'flex' : 'none';
        });
    }

    const forgotTrigger = document.getElementById('forgotPasswordTrigger');
    const forgotModal = document.getElementById('forgotPasswordModal');
    const closeForgotModal = document.getElementById('closeForgotModal');
    const forgotForm = document.getElementById('forgotPasswordForm');
    const forgotEmail = document.getElementById('forgotEmail');
    const forgotError = document.getElementById('forgotError');
    const forgotSuccess = document.getElementById('forgotSuccess');
    const forgotSubmitBtn = document.getElementById('forgotSubmitBtn');

    const openForgotModal = () => {
        if (!forgotModal) return;
        forgotModal.classList.add('is-open');
        document.body.style.overflow = 'hidden';
        if (forgotError) forgotError.textContent = '';
        if (forgotSuccess) forgotSuccess.style.display = 'none';
        setTimeout(() => forgotEmail?.focus(), 0);
    };

    const closeForgotPasswordModal = () => {
        if (!forgotModal) return;
        forgotModal.classList.remove('is-open');
        document.body.style.overflow = '';
    };

    if (forgotTrigger && forgotModal) {
        forgotTrigger.addEventListener('click', e => {
            e.preventDefault();
            openForgotModal();
        });
    }

    if (closeForgotModal && forgotModal) {
        closeForgotModal.addEventListener('click', closeForgotPasswordModal);
        forgotModal.addEventListener('click', e => {
            if (e.target === forgotModal) closeForgotPasswordModal();
        });
    }

    if (forgotForm && forgotSubmitBtn && forgotEmail) {
        forgotForm.addEventListener('submit', async e => {
            e.preventDefault();

            const email = forgotEmail.value.trim();
            if (!email) {
                if (forgotError) {
                    forgotError.textContent = 'Please enter your email address.';
                }
                return;
            }

            if (forgotError) forgotError.textContent = '';
            if (forgotSuccess) forgotSuccess.style.display = 'none';

            const originalText = forgotSubmitBtn.innerHTML;
            forgotSubmitBtn.disabled = true;
            forgotSubmitBtn.innerHTML = 'Sending...';

            try {
                const response = await fetch('/password-reset/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'X-Requested-With': 'XMLHttpRequest'
                    },
                    body: new URLSearchParams({
                        email,
                        csrfmiddlewaretoken: document.querySelector('#forgotPasswordForm [name=csrfmiddlewaretoken]')?.value || ''
                    }),
                    credentials: 'same-origin'
                });

                const contentType = response.headers.get('content-type') || '';
                if (contentType.includes('application/json')) {
                    const data = await response.json();
                    if (data.success === false) {
                        if (forgotError) forgotError.textContent = data.message || 'Unable to send reset link.';
                    } else {
                        if (forgotSuccess) forgotSuccess.style.display = 'block';
                    }
                } else {
                    if (forgotSuccess) forgotSuccess.style.display = 'block';
                }
            } catch (err) {
                if (forgotError) forgotError.textContent = 'Something went wrong. Please try again.';
            } finally {
                forgotSubmitBtn.disabled = false;
                forgotSubmitBtn.innerHTML = originalText;
            }
        });
    }

    // School Autocomplete logic
    const schoolInput = document.getElementById('id_school');
    const schoolAutocomplete = document.getElementById('schoolAutocomplete');
    const localSchools = [
        { name: "University of San Carlos - (USC)", country: "Cebu" },
        { name: "Cebu Technological University - (CTU)", country: "Cebu" },
        { name: "Cebu Eastern College - (CEC)", country: "Cebu" },
        { name: "University of Cebu - (UC) Main", country: "Cebu" },
        { name: "University of Cebu - (UC) Banilad", country: "Cebu" },
        { name: "University of the Philippines - (UP) Cebu", country: "Cebu" },
        { name: "University of San Jose-Recoletos - (USJR)", country: "Cebu" },
        { name: "Cebu Institute of Technology - University - (CIT-U)", country: "Cebu" },
        { name: "Cebu Normal University - (CNU)", country: "Cebu" },
        { name: "Southwestern University - (SWU) PHINMA", country: "Cebu" },
        { name: "Asian College of Technology - (ACT)", country: "Cebu" },
        { name: "Velez College", country: "Cebu" },
        { name: "Cebu Doctors' University - (CDU)", country: "Cebu" },
        { name: "St. Theresa's College - (STC) Cebu", country: "Cebu" },
        { name: "University of the Philippines - (UP) Diliman", country: "Quezon City" },
        { name: "University of the Philippines - (UP) Manila", country: "Manila" },
        { name: "Ateneo de Manila University - (ADMU)", country: "Quezon City" },
        { name: "De La Salle University - (DLSU) Manila", country: "Manila" },
        { name: "University of Santo Tomas - (UST)", country: "Manila" },
        { name: "Far Eastern University - (FEU)", country: "Manila" },
        { name: "Mapúa University", country: "Manila" },
        { name: "National University - (NU)", country: "Manila" },
        { name: "University of the East - (UE) Manila", country: "Manila" },
        { name: "Polytechnic University of the Philippines - (PUP)", country: "Manila" },
        { name: "Pamantasan ng Lungsod ng Maynila - (PLM)", country: "Manila" },
        { name: "San Beda University", country: "Manila" }
    ];
    let schoolTimeout;

    if (schoolInput && schoolAutocomplete) {
        schoolInput.addEventListener('input', (e) => {
            const query = e.target.value.trim();
            if (query.length < 2) {
                schoolAutocomplete.style.display = 'none';
                return;
            }
            
            clearTimeout(schoolTimeout);
            
            const qLower = query.toLowerCase();
            let localResults = localSchools
                .filter(s => s.name.toLowerCase().includes(qLower));
                
            const renderSchools = (results) => {
                if (results.length > 0) {
                    schoolAutocomplete.innerHTML = '';
                    results.forEach(school => {
                        const item = document.createElement('div');
                        item.className = 'search-result-item';
                        item.style.cursor = 'pointer';
                        item.innerHTML = `
                            <div class="result-avatar"><i class="fa-solid fa-school"></i></div>
                            <div class="result-info">
                                <div class="result-name">${school.name}</div>
                                <div class="result-meta">${school.country}</div>
                            </div>
                        `;
                        item.addEventListener('click', () => {
                            schoolInput.value = school.name;
                            schoolAutocomplete.style.display = 'none';
                        });
                        schoolAutocomplete.appendChild(item);
                    });
                    schoolAutocomplete.style.display = 'block';
                } else {
                    schoolAutocomplete.style.display = 'none';
                }
            };
            
            if (localResults.length > 0) renderSchools(localResults);

            schoolTimeout = setTimeout(async () => {
                try {
                    const res = await fetch(`http://universities.hipolabs.com/search?name=${encodeURIComponent(query)}&country=Philippines`);
                    let data = await res.json();
                    
                    let uniqueSchools = [...localResults];
                    let names = new Set(localResults.map(r => r.name.toLowerCase()));
                    
                    for(let i=0; i<data.length; i++) {
                        let apiName = data[i].name;
                        let apiNameLower = apiName.toLowerCase();
                        
                        let isDuplicate = false;
                        for(let ln of names) {
                            if (ln.includes(apiNameLower) || apiNameLower.includes(ln)) {
                                isDuplicate = true;
                                break;
                            }
                        }

                        if(!isDuplicate && !names.has(apiNameLower)) {
                            names.add(apiNameLower);
                            let loc = data[i].country;
                            if (loc === "Philippines") {
                                const regionMap = [
                                    { keys: ["manila", "ue manila", "pup", "plm", "philippine normal", "technological university of the philippines", "lyceum", "women's university", "womens university", "christian university", "adamson", "arellano", "centro escolar"], loc: "Manila" },
                                    { keys: ["diliman", "quezon", "ramon magsaysay", "ateneo de manila"], loc: "Quezon City" },
                                    { keys: ["cebu", "visayas university", "university of the visayas", "southern philippines foundation", "san jose recoletos", "usjr"], loc: "Cebu" },
                                    { keys: ["baguio", "cordillera", "military academy"], loc: "Baguio" },
                                    { keys: ["los banos", "los baños", "open university"], loc: "Laguna" },
                                    { keys: ["davao", "philippines mindanao", "ateneo de davao", "southeastern philippines"], loc: "Davao" },
                                    { keys: ["pampanga", "clark", "assumption", "angeles"], loc: "Pampanga" },
                                    { keys: ["iloilo", "lloilo", "philippines visayas", "san agustin", "central philippine"], loc: "Iloilo" },
                                    { keys: ["leyte", "visayas state"], loc: "Leyte" },
                                    { keys: ["mindanao"], loc: "Mindanao" },
                                    { keys: ["batangas"], loc: "Batangas" },
                                    { keys: ["bulacan", "regina carmeli"], loc: "Bulacan" },
                                    { keys: ["cavite", "de la salle dasma", "adventist university"], loc: "Cavite" },
                                    { keys: ["zamboanga", "ateneo de zamboanga"], loc: "Zamboanga" },
                                    { keys: ["bicol", "naga", "ateneo de naga", "legazpi", "northeastern philippines", "nueva caceres"], loc: "Bicol" },
                                    { keys: ["pangasinan", "dagupan"], loc: "Pangasinan" },
                                    { keys: ["nueva ecija", "wesleyan"], loc: "Nueva Ecija" },
                                    { keys: ["bohol", "tagbilaran"], loc: "Bohol" },
                                    { keys: ["negros occidental", "negros occidental-recoletos", "saint la salle", "bacolod"], loc: "Bacolod" },
                                    { keys: ["negros", "silliman", "dumaguete"], loc: "Dumaguete" },
                                    { keys: ["cagayan de oro", "ateneo de cagayan", "xavier university"], loc: "Cagayan de Oro" },
                                    { keys: ["palawan"], loc: "Palawan" },
                                    { keys: ["makati"], loc: "Makati" },
                                    { keys: ["pasig", "asia and the pacific"], loc: "Pasig" },
                                    { keys: ["taguig"], loc: "Taguig" },
                                    { keys: ["mandaluyong", "jose rizal university"], loc: "Mandaluyong" },
                                    { keys: ["valenzuela"], loc: "Valenzuela" },
                                    { keys: ["marikina"], loc: "Marikina" },
                                    { keys: ["pasay"], loc: "Pasay" },
                                    { keys: ["muntinlupa"], loc: "Muntinlupa" },
                                    { keys: ["paranaque"], loc: "Parañaque" },
                                    { keys: ["las pinas", "perpetual help"], loc: "Las Piñas" },
                                    { keys: ["tarlac"], loc: "Tarlac" },
                                    { keys: ["cagayan state", "cagayan valley"], loc: "Cagayan" },
                                    { keys: ["eastern philippines"], loc: "Samar" },
                                    { keys: ["northern philippines"], loc: "Ilocos Sur" },
                                    { keys: ["northwestern university"], loc: "Ilocos Norte" }
                                ];
                                for (let r of regionMap) {
                                    if (r.keys.some(k => apiNameLower.includes(k))) {
                                        loc = r.loc;
                                        break;
                                    }
                                }
                                
                                // If it didn't match any specific region, just leave it as 'PH' or completely hide the generic 'Philippines' string
                                if (loc === "Philippines") {
                                    loc = "PH Campus"; // A cleaner fallback than the generic country name
                                }
                            }
                            uniqueSchools.push({ name: apiName, country: loc });
                        }
                    }
                    uniqueSchools = uniqueSchools.slice(0, 50);
                    
                    renderSchools(uniqueSchools);
                } catch(err) {
                    console.error("School fetch error:", err);
                }
            }, 350);
        });

        document.addEventListener('click', (e) => {
            if (!schoolInput.contains(e.target) && !schoolAutocomplete.contains(e.target)) {
                schoolAutocomplete.style.display = 'none';
            }
        });
    }
}
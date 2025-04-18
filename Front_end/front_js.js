const AIRTABLE_API_KEY = "patvRrcGqVW8jViPr.d58ee78caa4df29c5df5b182b20679bf0c071b44af95b85509dc0aaaefa466c2";
const BASE_ID = "appPvSF0KrHHv7wfz";
const TABLE_NAME = "Client_Tab";
const url = `https://api.airtable.com/v0/${BASE_ID}/${TABLE_NAME}`


  // Vérification du format d'une adresse mail
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

  // Vérification de l'existence d'un domaine d'adresse mail
const checkEmailDomain = async (email) => {
  const domain = email.split('@')[1];
  const response = await fetch(`https://dns.google/resolve?name=${domain}&type=MX`);
  const data = await response.json();

  if (data.Answer && data.Answer.length > 0) {
     return true
  }else {
    return false
  }
};

// Vérifie si l'adresse mail n'est pas déjà présente dans la base de donnée
const isEmailInData = async (email_to_check) => {
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      "Authorization":  `Bearer ${AIRTABLE_API_KEY}`,
      "content-type": 'application/json',
    },
  });

  if (!response.ok) {
    console.log("Erreur lors de la récupération: ", response.statusText);
    return;
  }
  const data = await response.json();
  let isemail = false

  for (const record of data.records) {
    const emaildata = record.fields.Email;

    if (emaildata === email_to_check) {
      console.log("data de l'email déjà présent", emaildata)
      isemail = true;
      break;
    }
  }
  return isemail
}

async function getColumnNames() {
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      "Authorization":  `Bearer ${AIRTABLE_API_KEY}`,
      "content-type": 'application/json',
    },
  });

  if (!response.ok) {
    console.log("Erreur lors de la récupération: ", response.statusText);
    return;
  }
  const data = await response.json();
  
  for (const record of data.records) {
    const nom = record.fields.Nom;

    if (nom === "Dupont") {
      const recordID = record.id;
      const updateData = {
        fields: {
          Nom: "De Laportière",
          Email: "Leyandre@live.fr"
        }
      };

      await updateRecord(recordID, updateData);
    }

  }
}

// Fonction pour mettre à jour un record spécifique
async function updateRecord(recordId, updateData) {
  const updateUrl = `${url}/${recordId}`;

  const response = await fetch(updateUrl, {
    method: 'PATCH',
    headers: {
      "Authorization": `Bearer ${AIRTABLE_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(updateData)
  });

  if (!response.ok) {
    console.error(`Erreur lors de la mise à jour du record ${recordId}:`, response.statusText);
  } else {
    console.log(`Record ${recordId} mis à jour avec succès.`);
  }
}

// Fonction pour créer un record spécifique
async function createRecord(data) {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      "Authorization": `Bearer ${AIRTABLE_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      fields: data,
    }),
  });

  if (!response.ok) {
    console.error(`Erreur lors de la création du record:`, response.statusText);
  } else {
    const jsonResponse = await response.json();
    console.log(`Record créé avec succès.`, jsonResponse);
  }
}

  // Gère l'enregistrement d'un nouveau compte avec toutes les étapes nécessaires
async function handleSignup(client_data, event) {
  console.log("hey");

  event.preventDefault();
  try {
    
    if (isValidEmail(client_data.Email)) {
      if (await checkEmailDomain(client_data.Email)){
        if (!(await isEmailInData(client_data.Email))) {
          if ((client_data.Nom.length > 0) && (client_data.Prenom.length > 0)) {
            await createRecord(client_data);
          }else {
            console.log("Nom ou Prénom non spécifié");
          }
        }else {
          console.log("Adresse mail déjà présente dans la base de donnée");
        }
      }else {
        console.log("Le domaine de l'adresse mail n'existe pas");
      }
    }
  }catch (error) {
    console.error("Erreur dans handleSignup : ", error);
  }
  
}

















document.addEventListener("DOMContentLoaded", () => {
  // Sélection des éléments principaux
  const homeSection = document.getElementById("home");
  const homeButton = document.getElementById("home-button")
  const progressContainer = document.querySelector(".progress-container");
  const progressBar = document.querySelector(".progress-bar");
  const steps = Array.from(document.querySelectorAll(".step-container"));
  const startBtn = document.getElementById("start-btn");
  const visual = document.getElementById("visual");
  const matchDetailsContainer = document.getElementById("match-details");
  const downloadBtn = document.getElementById("download-btn");
  const premiumPopup = document.getElementById("premium-popup");
  const signupPopup = document.getElementById("signup-popup");
  const closePopupBtn = document.getElementById("popup-close");
  const subscribeBtn = document.getElementById("subscribe-btn");
  const stayFreeBtn = document.getElementById("stay-free-btn");
  const signupDetailsContainer = document.getElementById("client-signup-details");
  const signupNextBtn = document.getElementById("signupNext-btn");
  const signupPrevBtn = document.getElementById("signupPrev-btn");
  //const premiumButtons = document.querySelectorAll(".btn-premium");

  let currentStep = 0;
  let format = "post"; // Format par défaut
  let matches = []; // Données des matchs
  let isPremium = false; // Par défaut : utilisateur non premium
  let client_data = {
    Nom : "",
    Prenom : "",
    Email : ""
  };

  // Affichage d'une étape spécifique
  const showStep = (index) => {
    steps.forEach((step, i) => {
      step.classList.toggle("active", i === index);
    });
    updateProgressBar(index);
  };

  // Mise à jour de la barre de progression
  const resetProgressBar = () => {
    progressBar.style.width = `${0}%`;
  };

  // Mise à jour de la barre de progression
  const updateProgressBar = (index) => {
    const progress = ((index + 1) / steps.length) * 100;
    progressBar.style.width = `${progress}%`;
  };

  // Démarrer le processus
  const startProcess = () => {
    homeSection.classList.add("hidden");
    progressContainer.classList.add("active");
    setTimeout(() => showStep(0), 500);
  };

  // Renvoie à la page d'accueil
  const returnHome = () => {
    if (homeSection.classList.contains("hidden")) { // Vérifie qu'on ne se trouve pas sur la page d'accueil
      currentStep = 0;
      steps.forEach((step) => step.classList.remove("active")); // Désactive toutes les étapes
      progressContainer.classList.remove("active") // Retire la barre de progression
      resetProgressBar();
      homeSection.classList.remove("hidden"); // Affiche la page d'accueil
    }
  }

  // Mettre à jour le format (Post ou Story)
  const updateFormat = (selectedFormat) => {
    format = selectedFormat;

    // Dimensions dynamiques selon le format choisi
    if (format === "post") {
      visual.style.width = "300px";
      visual.style.height = "300px";
    } else if (format === "story") {
      visual.style.width = "300px";
      visual.style.height = "533px";
    }

    updatePreview();
  };

  // Génération dynamique des champs de match
  const generateMatchFields = (matchCount) => {
    matches = Array.from({ length: matchCount }, () => ({
      homeTeam: "",
      awayTeam: "",
      homeScore: "",
      awayScore: "",
    }));

    matchDetailsContainer.innerHTML = ""; // Réinitialisation des champs
    matches.forEach((_, index) => {
      const matchDiv = document.createElement("div");
      matchDiv.innerHTML = `
        <h3>Match ${index + 1}</h3>
        <input type="text" placeholder="Équipe domicile" data-index="${index}" data-field="homeTeam">
        <input type="number" placeholder="Score domicile" data-index="${index}" data-field="homeScore">
        <input type="text" placeholder="Équipe extérieur" data-index="${index}" data-field="awayTeam">
        <input type="number" placeholder="Score extérieur" data-index="${index}" data-field="awayScore">
      `;
      matchDetailsContainer.appendChild(matchDiv);
    });

    // Écouteurs pour chaque champ de match
    matchDetailsContainer.querySelectorAll("input").forEach((input) =>
      input.addEventListener("input", (e) => {
        const index = e.target.dataset.index;
        const field = e.target.dataset.field;
        matches[index][field] = e.target.value;
        updatePreview();
      })
    );
  };

  // Mise à jour des couleurs
  const updateColors = () => {
    const primaryColor = document.getElementById("primary-color").value;
    const secondaryColor = document.getElementById("secondary-color").value;
    visual.style.background = `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`;
  };

  // Ajouter un logo uploadé
  const addLogo = () => {
    const logoInput = document.getElementById("logo-upload");
    if (logoInput.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const logoImg = document.createElement("img");
        logoImg.src = event.target.result;
        logoImg.style.position = "absolute";
        logoImg.style.top = "10px";
        logoImg.style.right = "10px";
        logoImg.style.width = "50px";
        logoImg.style.height = "50px";
        logoImg.style.borderRadius = "50%";
        logoImg.style.boxShadow = "0px 4px 6px rgba(0, 0, 0, 0.3)";
        visual.appendChild(logoImg);
      };
      reader.readAsDataURL(logoInput.files[0]);
    }
  };

  // Mise à jour de la prévisualisation
  const updatePreview = () => {
    visual.innerHTML = ""; // Nettoyage du visuel

    // Ajouter les couleurs
    updateColors();

    // Ajouter le logo
    addLogo();

    // Ajouter les matchs
    matches.forEach((match) => {
      const matchElement = document.createElement("div");
      matchElement.className = "match";
      matchElement.innerHTML = `
        <div>${match.homeTeam || "Équipe A"} (${match.homeScore || 0})</div>
        <div>vs</div>
        <div>${match.awayTeam || "Équipe B"} (${match.awayScore || 0})</div>
      `;
      visual.appendChild(matchElement);
    });
  };

  // Téléchargement de la prévisualisation
  const downloadVisual = () => {
    html2canvas(visual, {
      backgroundColor: null,
      scale: 2,
    }).then((canvas) => {
      const link = document.createElement("a");
      link.download = "visual.png";
      link.href = canvas.toDataURL("image/png");
      link.click();
    });
  };

  // Gestion des boutons premiums
  document.querySelectorAll(".btn-premium").forEach((btn) =>
    btn.addEventListener("click", () => {
      if (!isPremium) {
        premiumPopup.classList.remove("hidden");
        premiumPopup.classList.add("active");
      }
      else {
        const matchCount = btn.dataset.matchCount;

        if (matchCount) generateMatchFields(Number(matchCount));
      }
    })
  );

  // Mute les boutons premiums match en bouton classique
  const free_match_premium_button = () => {
    document.querySelectorAll(".btn-premium").forEach((btn) => { 
      if (btn.classList.contains("match-btn")) {

        btn.classList.replace("btn-premium", "btn-next")
      }
    });
  };

  // Génération dynamique des champs d'inscription client
  const generateClientFields = () => {
    signupDetailsContainer.innerHTML = ""; // Réinitialisation des champs

    Object.entries(client_data).forEach(([key, value]) => {
        const signupDiv = document.createElement("div");

        const formattedKey = key.charAt(0).toUpperCase() + key.slice(1).toLowerCase();

        // Création de l'input
        const inputField = document.createElement("input");
        inputField.type = "text";
        inputField.placeholder = `Entrez votre ${formattedKey}`;
        inputField.dataset.field = key;
        inputField.value = value; // Pré-remplir avec la valeur actuelle de client_data

        // Mettre à jour client_data quand l'utilisateur tape
        inputField.addEventListener("input", (event) => {
            client_data[key] = event.target.value;
            console.log(client_data); // Vérification en console
        });

        // Ajout des éléments au DOM
        signupDiv.appendChild(document.createElement("h3")).textContent = formattedKey;
        signupDiv.appendChild(inputField);
        signupDetailsContainer.appendChild(signupDiv);
    });
};

  // Fermer le pop-up premium
  closePopupBtn.addEventListener("click", () => {
    premiumPopup.classList.remove("active");
  });

  // Activer le mode premium
  subscribeBtn.addEventListener("click", () => {
    isPremium = true;
    premiumPopup.classList.remove("active");
    signupPopup.classList.remove("hidden");
    signupPopup.classList.add("active")
    generateClientFields();
  });

  // Rester en mode free
  stayFreeBtn.addEventListener("click", () => {
    premiumPopup.classList.remove("active");
  });

  // Enregistrer un nouveau compte
  signupNextBtn.addEventListener("click", (event) => {
    handleSignup(client_data, event);
    signupPopup.classList.remove("active");
    free_match_premium_button()
  });

  // Navigation entre étapes
  document.querySelectorAll(".btn-next").forEach((btn) =>
    btn.addEventListener("click", () => {
      const matchCount = btn.dataset.matchCount;
      const selectedFormat = btn.dataset.format;

      if (matchCount) generateMatchFields(Number(matchCount));
      if (selectedFormat) updateFormat(selectedFormat);

      if (currentStep < steps.length - 1) {
        currentStep++;
        showStep(currentStep);
      }
    })
  );

  document.querySelectorAll(".btn-prev").forEach((btn) =>
    btn.addEventListener("click", () => {
      if (currentStep > 0) {
        currentStep--;
        showStep(currentStep);
      }
      else {
        currentStep--;
        returnHome()
      }
    })
  );

  // Gestion des couleurs et du logo
  document.getElementById("primary-color").addEventListener("input", updatePreview);
  document.getElementById("secondary-color").addEventListener("input", updatePreview);
  document.getElementById("logo-upload").addEventListener("change", updatePreview);

  // Téléchargement du visuel
  downloadBtn.addEventListener("click", downloadVisual);

  // Démarrage
  startBtn.addEventListener("click", startProcess);

  // Retour à la page d'accueil
  homeButton.addEventListener("click", returnHome)

  // Initialisation
  showStep(-1); // Cacher toutes les étapes au départ
});

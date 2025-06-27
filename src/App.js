import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import Web3Modal from "web3modal";

const MOVEZ_PRESALE_ADDRESS = "TON_ADRESSE_CONTRAT_PREVENTE_ICI";
const MOVEZ_TOKEN_ADDRESS = "0x9e7751FF111Ba82D8dF9A91e6073ad31091Ff3a3";
const MOVEZ_PRESALE_ABI = [
  "function buy() external payable",
  "function maxPerBuyer() view returns (uint256)",
  "function price() view returns (uint256)",
  "function startTime() view returns (uint256)",
  "function endTime() view returns (uint256)",
  "function purchased(address) view returns (uint256)",
];

function App() {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);
  const [account, setAccount] = useState(null);
  const [price, setPrice] = useState(null);
  const [maxPerBuyer, setMaxPerBuyer] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);
  const [purchased, setPurchased] = useState(null);
  const [bnbAmount, setBnbAmount] = useState("");
  const [status, setStatus] = useState("");

  // Connexion au wallet
  async function connectWallet() {
    try {
      const web3Modal = new Web3Modal();
      const connection = await web3Modal.connect();
      const prov = new ethers.providers.Web3Provider(connection);
      const sign = prov.getSigner();
      const acct = await sign.getAddress();

      const contr = new ethers.Contract(
        MOVEZ_PRESALE_ADDRESS,
        MOVEZ_PRESALE_ABI,
        sign
      );

      setProvider(prov);
      setSigner(sign);
      setAccount(acct);
      setContract(contr);
    } catch (e) {
      setStatus("Erreur de connexion au wallet");
      console.error(e);
    }
  }

  // Charger les données de prévente
  useEffect(() => {
    if (!contract) return;

    async function fetchData() {
      try {
        const p = await contract.price();
        const max = await contract.maxPerBuyer();
        const start = await contract.startTime();
        const end = await contract.endTime();
        const purchasedAmount = await contract.purchased(account);

        setPrice(ethers.utils.formatEther(p));
        setMaxPerBuyer(ethers.utils.formatUnits(max, 18));
        setStartTime(new Date(start.toNumber() * 1000));
        setEndTime(new Date(end.toNumber() * 1000));
        setPurchased(ethers.utils.formatUnits(purchasedAmount, 18));
      } catch (e) {
        console.error(e);
        setStatus("Erreur de chargement des données contrat");
      }
    }
    fetchData();
  }, [contract, account]);

  // Fonction d'achat
  async function buyTokens() {
    if (!contract || !signer) {
      setStatus("Connecte ton wallet d'abord");
      return;
    }
    if (!bnbAmount || isNaN(bnbAmount) || Number(bnbAmount) <= 0) {
      setStatus("Entre un montant valide en BNB");
      return;
    }

    setStatus("Transaction en cours...");
    try {
      const tx = await contract.buy({
        value: ethers.utils.parseEther(bnbAmount),
      });
      await tx.wait();
      setStatus("Achat réussi !");
      setBnbAmount("");
      // Met à jour le montant acheté
      const purchasedAmount = await contract.purchased(account);
      setPurchased(ethers.utils.formatUnits(purchasedAmount, 18));
    } catch (e) {
      setStatus("Erreur lors de l'achat");
      console.error(e);
    }
  }

  return (
    <div style={{ maxWidth: 600, margin: "auto", fontFamily: "Arial, sans-serif", padding: 20 }}>
      <h1>Prévente MOVEZ</h1>
      {!account ? (
        <button onClick={connectWallet} style={{ padding: "10px 20px", fontSize: 16 }}>
          Connecter MetaMask
        </button>
      ) : (
        <>
          <p><b>Adresse connectée :</b> {account}</p>
          <p><b>Prix du token :</b> {price ? `${price} BNB` : "Chargement..."}</p>
          <p><b>Plafond par acheteur :</b> {maxPerBuyer || "Chargement..."} MOVEZ</p>
          <p><b>Début prévente :</b> {startTime ? startTime.toLocaleString() : "Chargement..."}</p>
          <p><b>Fin prévente :</b> {endTime ? endTime.toLocaleString() : "Chargement..."}</p>
          <p><b>Tokens déjà achetés :</b> {purchased || "0"} MOVEZ</p>

          <input
            type="number"
            placeholder="Montant BNB à dépenser"
            value={bnbAmount}
            onChange={(e) => setBnbAmount(e.target.value)}
            style={{ padding: 10, fontSize: 16, width: "100%", marginBottom: 10 }}
            min="0"
          />
          <button onClick={buyTokens} style={{ padding: "10px 20px", fontSize: 16, width: "100%" }}>
            Acheter des MOVEZ
          </button>

          {status && <p style={{ marginTop: 10 }}>{status}</p>}
        </>
      )}

      <hr style={{ margin: "20px 0" }} />
      <h3>FAQ</h3>
      <p><b>Q :</b> Quel est le prix du token ?</p>
      <p><b>R :</b> {price ? `${price} BNB` : "Chargement..."} par MOVEZ.</p>
      <p><b>Q :</b> Quelle est la durée de la prévente ?</p>
      <p><b>R :</b> Du {startTime ? startTime.toLocaleString() : "..."} au {endTime ? endTime.toLocaleString() : "..."}</p>
      <p><b>Q :</b> Quel est le plafond d'achat ?</p>
      <p><b>R :</b> Maximum {maxPerBuyer || "..."} MOVEZ par acheteur.</p>
    </div>
  );
}

export default App;

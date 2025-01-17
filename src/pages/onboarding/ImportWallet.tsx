import styled from "styled-components";
import { useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { useSnackbar } from "../../hooks/useSnackbar";
import { BackButton } from "../../components/BackButton";
import { Text, HeaderText } from "../../components/Reusable";
import { Input } from "../../components/Input";
import { Button } from "../../components/Button";
import { PandaHead } from "../../components/PandaHead";
import { WifKeys, useKeys } from "../../hooks/useKeys";
import { useBottomMenu } from "../../hooks/useBottomMenu";
import { PageLoader } from "../../components/PageLoader";
import { Show } from "../../components/Show";
import { sleep } from "../../utils/sleep";
import { useTheme } from "../../hooks/useTheme";

const Content = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
`;

const FormContainer = styled.form`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  margin: 0;
  padding: 0;
  border: none;
  background: none;
`;

export const ImportWallet = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [step, setStep] = useState(1);
  const [payPk, setPayPk] = useState("");
  const [ordPk, setOrdPk] = useState("");

  const { addSnackbar } = useSnackbar();
  const { generateKeysFromWifAndStoreEncrypted } = useKeys();
  const { hideMenu, showMenu } = useBottomMenu();
  const [loading, setLoading] = useState(false);
  const hiddenFileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    hideMenu();

    return () => {
      showMenu();
    };
  }, [hideMenu, showMenu]);

  const handleImport = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      setLoading(true);
      if (password.length < 8) {
        setLoading(false);
        addSnackbar("The password must be at least 8 characters!", "error");
        return;
      }

      if (password !== passwordConfirm) {
        addSnackbar("The passwords do not match!", "error");
        return;
      }

      if (!payPk || !ordPk) {
        addSnackbar("Both payPk and ordPk WIFs are required!", "error");
        return;
      }

      // Some artificial delay for the loader
      await sleep(50);
      const keys = generateKeysFromWifAndStoreEncrypted(password, {
        payPk,
        ordPk,
      });
      if (!keys) {
        addSnackbar("An error occurred while restoring the wallet!", "error");
        return;
      }

      setStep(3);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const handleJsonUploadClick = () => {
    hiddenFileInput.current?.click();
  };

  const handleFileRead = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === "application/json") {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const text = e.target?.result as string;
        try {
          const jsonData = JSON.parse(text) as WifKeys;
          if (!jsonData.payPk || !jsonData.ordPk) {
            addSnackbar("Invalid 1Sat Ord Wallet format!", "error");
            return;
          }
          setPayPk(jsonData.payPk);
          setOrdPk(jsonData.ordPk);
          setStep(2);
        } catch (error) {
          console.error("Error parsing JSON file", error);
          addSnackbar("Error parsing JSON file!", "error");
          return;
        }
      };
      reader.readAsText(file);
    } else {
      console.error("Unsupported file type. Please upload a JSON file.");
      addSnackbar("Unsupported file type. Please upload a JSON file.", "error");
    }
  };

  const passwordStep = (
    <>
      <BackButton onClick={() => navigate("/")} />
      <Content>
        <HeaderText theme={theme}>Create a password</HeaderText>
        <Text theme={theme}>This is used to unlock your wallet.</Text>
        <FormContainer onSubmit={handleImport}>
          <Input
            theme={theme}
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Input
            theme={theme}
            placeholder="Confirm Password"
            type="password"
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            style={{ marginBottom: "2rem" }}
          />
          <Button theme={theme} type="primary" label="Finish" isSubmit />
        </FormContainer>
      </Content>
    </>
  );

  const enterWifsStep = (
    <>
      <BackButton onClick={() => navigate("/")} />
      <Content>
        <HeaderText theme={theme}>Import a WIF Wallet</HeaderText>
        <Text style={{ margin: "1rem" }} theme={theme}>
          Input assets directly from your WIF private keys or import a 1Sat JSON
          Wallet.
        </Text>
        <FormContainer onSubmit={() => setStep(2)}>
          <Input
            theme={theme}
            placeholder="Pay WIF private key"
            type="text"
            value={payPk}
            onChange={(e) => setPayPk(e.target.value)}
          />
          <Input
            theme={theme}
            placeholder="Ord WIF private key"
            type="text"
            value={ordPk}
            onChange={(e) => setOrdPk(e.target.value)}
          />
          <Text theme={theme} style={{ margin: "1rem 0 1rem" }}>
            Make sure you are in a safe place and no one is watching.
          </Text>
          <Button theme={theme} type="primary" label="Next" isSubmit />
        </FormContainer>
        <Text style={{ margin: "1rem" }} theme={theme}>
          ------ OR ------
        </Text>
        <Button
          theme={theme}
          type="secondary"
          onClick={handleJsonUploadClick}
          label="Upload 1Sat JSON"
          style={{ margin: 0 }}
        />
        <input
          type="file"
          ref={hiddenFileInput}
          onChange={handleFileRead}
          style={{ display: "none" }}
          accept="application/json"
        />
      </Content>
    </>
  );

  const successStep = (
    <>
      <Content>
        <PandaHead />
        <HeaderText theme={theme}>Success!</HeaderText>
        <Text theme={theme} style={{ marginBottom: "1rem" }}>
          Your wallet has been imported.
        </Text>
        <Button
          theme={theme}
          type="primary"
          label="Enter"
          onClick={() => navigate("/bsv-wallet")}
        />
      </Content>
    </>
  );

  return (
    <>
      <Show when={loading}>
        <PageLoader theme={theme} message="Importing Wallet..." />
      </Show>
      <Show when={!loading && step === 1}>{enterWifsStep}</Show>
      <Show when={!loading && step === 2}>{passwordStep}</Show>
      <Show when={!loading && step === 3}>{successStep}</Show>
    </>
  );
};

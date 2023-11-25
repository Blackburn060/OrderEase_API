const express = require("express");
const cors = require("cors");
const admin = require("firebase-admin");
const request = require("request");
const serviceAccount = require("./orderease-76588-firebase-adminsdk-ie91v-65023f0baa.json");

const app = express();
const PORT = process.env.PORT || 3001;

// Configure o cors
app.use(cors({ origin: "*" }));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://orderease-76588-default-rtdb.firebaseio.com",
});

app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: "50mb" }));

const db = admin.firestore();

// Function to upload the image to ImgBB using the request library
const uploadImageToImgBB = async (imageBase64) => {
  try {
    const options = {
      method: "POST",
      url: "https://api.imgbb.com/1/upload?key=6e2825a52e0efeaa3e997ff88d245086",
      headers: {
        "content-type": "multipart/form-data",
      },
      formData: {
        image: imageBase64,
      },
    };

    const response = await new Promise((resolve, reject) => {
      request(options, (error, response, body) => {
        if (error) {
          reject(error);
        } else {
          resolve(body);
        }
      });
    });

    const responseData = JSON.parse(response);
    const imageUri = responseData.data.url;
    return imageUri;
  } catch (error) {
    throw error;
  }
};

// Make the post in the firestore api (Create)
app.post("/api/adicionar-produto", async (req, res) => {
  try {
    const {
      productName,
      productDescription,
      productCategory,
      productValue,
      imageBase64,
      productStatus,
    } = req.body;

    let imageUri;

    // Remova o prefixo "data:image/png;base64," da imagem
    // Se houver uma imagem, faça o upload e obtenha a URI
    if (imageBase64) {
      const base64WithoutPrefix = imageBase64.replace(
        /^data:image\/[a-zA-Z+]+;base64,/,
        ""
      );
      imageUri = await uploadImageToImgBB(base64WithoutPrefix);
    } else {
      imageUri = "https://i.ibb.co/cNZHPHT/e1b861201f3b.png";
    }

    // Converta productValue para número
    const numericProductValue = parseFloat(productValue.replace(/[^0-9.]/g, ""));

    const collectionRef = db.collection("Produto");

    const data = {
      nome: productName,
      descricao: productDescription,
      categoria: productCategory,
      valor: numericProductValue,
      status: productStatus,
      imageUri: imageUri,
    };

    const docRef = await collectionRef.add(data);

    console.log("Servidor: Produto cadastrado com ID:", docRef.id);
    return res.status(201).json({
      productId: docRef.id,
      message: "Servidor: Produto cadastrado com sucesso",
    });
  } catch (error) {
    console.error("Erro no servidor:", error);
    return res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// Perform a get on the firestore api (Read)
app.get("/api/listar-produtos", async (req, res) => {
  try {
    let query = db.collection("Produto");

    // Adiciona uma condição específica, se fornecida nos parâmetros da solicitação
    if (req.query.status) {
      query = query.where("status", "==", req.query.status);
    }

    const productsSnapshot = await query.get();

    const productsData = productsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.status(200).json(productsData);
  } catch (error) {
    console.error("Erro ao buscar produtos:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// Route to update an existing product (update)
app.put("/api/atualizar-produto/:productId", async (req, res) => {
  try {
    const { productId } = req.params;
    const {
      productName,
      productDescription,
      productCategory,
      productValue,
      imageBase64,
    } = req.body;

    // Validação de campos
    if (
      !productName ||
      !productDescription ||
      !productCategory ||
      !productValue
    ) {
      return res.status(400).json({
        error: "Todos os campos são obrigatórios, incluindo a imagem.",
      });
    }

    let imageUri = null;

    // Remova o prefixo "data:image/png;base64," da imagem
    // Se houver uma imagem, faça o upload e obtenha a URI
    if (imageBase64) {
      const base64WithoutPrefix = imageBase64.replace(
        /^data:image\/[a-zA-Z+]+;base64,/,
        ""
      );
      imageUri = await uploadImageToImgBB(base64WithoutPrefix);
    }

    /* const imageUri = await uploadImageToImgBB(base64WithoutPrefix); */

    const collectionRef = db.collection("Produto");
    const productRef = collectionRef.doc(productId); // Use o ID do documento do Firestore

    const updateData = {
      nome: productName,
      descricao: productDescription,
      categoria: productCategory,
      valor: productValue,
    };

    if (imageUri) {
      updateData.imageUri = imageUri;
    }

    await productRef.update(updateData);

    console.log("Servidor: Produto atualizado com sucesso!");
    return res
      .status(200)
      .json({ message: "Servidor: Produto atualizado com sucesso" });
  } catch (error) {
    console.error("Erro no servidor:", error);
    return res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// Route to inactivate a product (delete)
app.delete("/api/excluir-produto/:productId", async (req, res) => {
  try {
    const { productId } = req.params;

    // Atualizar o status do produto para "Inativo"
    const collectionRef = db.collection("Produto");
    const productRef = collectionRef.doc(productId);

    await productRef.update({
      status: "Inativo",
    });

    console.log("Servidor: Produto excluído com sucesso!");
    return res
      .status(200)
      .json({ message: "Servidor: Produto excluído com sucesso" });
  } catch (error) {
    console.error("Erro no servidor:", error);
    return res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// Make the post in the firestore api (Create)
app.post("/api/adicionar-garcom", async (req, res) => {
  try {
    const {
      waiterName,
      waiterSurname,
      waiterEmail,
      waiterSituation,
      waiterPassword,
      waiterStatus,
    } = req.body;

    const collectionRef = db.collection("Garcom");

    const data = {
      nome: waiterName,
      sobrenome: waiterSurname,
      email: waiterEmail,
      senha: waiterPassword,
      situacao: waiterSituation,
      status: waiterStatus,
    };

    const docRef = await collectionRef.add(data);

    console.log("Servidor: Garçom cadastrado com ID:", docRef.id);
    return res.status(201).json({
      waiterId: docRef.id,
      message: "Servidor: Garçom cadastrado com sucesso",
    });
  } catch (error) {
    console.error("Erro no servidor:", error);
    return res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// Perform a get on the firestore api (Read)
app.get("/api/listar-garcons", async (req, res) => {
  try {
    let query = db.collection("Garcom");

    // Adiciona uma condição específica, se fornecida nos parâmetros da solicitação
    if (req.query.status) {
      query = query.where("status", "==", req.query.status);
    }

    const waitersSnapshot = await query.get();

    const waitersData = waitersSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.status(200).json(waitersData);
  } catch (error) {
    console.error("Erro ao buscar garçons:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// Route to update an existing product (update)
app.put("/api/atualizar-garcom/:waiterId", async (req, res) => {
  try {
    const { waiterId } = req.params;
    const {
      waiterName,
      waiterSurname,
      waiterEmail,
      waiterSituation,
      waiterPassword,
    } = req.body;

    // Validação de campos
    if (
      !waiterName ||
      !waiterSurname ||
      !waiterEmail ||
      !waiterSituation ||
      !waiterPassword
    ) {
      return res.status(400).json({
        error: "Todos os campos são obrigatórios.",
      });
    }

    const collectionRef = db.collection("Garcom");
    const waiterRef = collectionRef.doc(waiterId); // Use o ID do documento do Firestore

    const updateData = {
      nome: waiterName,
      sobrenome: waiterSurname,
      email: waiterEmail,
      senha: waiterPassword,
      situacao: waiterSituation,
    };

    await waiterRef.update(updateData);

    console.log("Servidor: Garçom atualizado com sucesso!");
    return res
      .status(200)
      .json({ message: "Servidor: Garçom atualizado com sucesso" });
  } catch (error) {
    console.error("Erro no servidor:", error);
    return res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// Route to inactivate a garcom (delete)
app.delete("/api/excluir-garcom/:waiterId", async (req, res) => {
  try {
    const { waiterId } = req.params;

    // Atualizar o status do garcom para "Inativo"
    const collectionRef = db.collection("Garcom");
    const waiterRef = collectionRef.doc(waiterId);

    await waiterRef.update({
      status: "Inativo",
    });

    console.log("Servidor: Garçom excluído com sucesso!");
    return res
      .status(200)
      .json({ message: "Servidor: Garçom excluído com sucesso" });
  } catch (error) {
    console.error("Erro no servidor:", error);
    return res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// Route to save general configurations
app.post("/api/salvar-configuracoes", async (req, res) => {
  try {
    const {
      companyName,
      companyLogo,
      loginPageImage,
      homePageImage,
      primaryColor,
      secondaryColor,
    } = req.body;

    // Upload de imagens e obtenção de URLs
    const companyLogoUrl = await uploadImageToImgBB(companyLogo);
    const loginPageImageUrl = await uploadImageToImgBB(loginPageImage);
    const homePageImageUrl = await uploadImageToImgBB(homePageImage);

    const collectionRef = db.collection("Configuracoes");
    const configuracoesGeraisDocRef = collectionRef.doc("configuracoesGerais");

    const configuracoesData = {
      companyName,
      companyLogo: companyLogoUrl,
      loginPageImage: loginPageImageUrl,
      homePageImage: homePageImageUrl,
      primaryColor,
      secondaryColor,
    };

    await configuracoesGeraisDocRef.set(configuracoesData, { merge: true });

    console.log("Servidor: Configurações salvas com sucesso!");
    return res
      .status(201)
      .json({ message: "Servidor: Configurações salvas com sucesso" });
  } catch (error) {
    console.error("Erro no servidor:", error);
    return res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// route to get requests
app.get("/api/obter-pedidos", async (req, res) => {
  try {
    const collectionRef = db.collection("pedidos");

    const pedidosSnapshot = await collectionRef.get();

    if (pedidosSnapshot.empty) {
      return res.status(404).json({ error: "Nenhum pedido encontrado" });
    }

    const pedidosData = [];
    
    // Itera sobre os documentos para obter os dados
    pedidosSnapshot.forEach((doc) => {
      pedidosData.push(doc.data());
    });

    return res.status(200).json(pedidosData);
  } catch (error) {
    console.error("Erro no servidor:", error);
    return res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// Route to get general configurations
app.get("/api/obter-configuracoes", async (req, res) => {
  try {
    const collectionRef = db.collection("Configuracoes");
    const configuracoesGeraisDocRef = collectionRef.doc("configuracoesGerais");

    const configuracoesSnapshot = await configuracoesGeraisDocRef.get();

    if (!configuracoesSnapshot.exists) {
      return res.status(404).json({ error: "Configurações não encontradas" });
    }

    const configuracoesData = configuracoesSnapshot.data();

    return res.status(200).json(configuracoesData);
  } catch (error) {
    console.error("Erro no servidor:", error);
    return res.status(500).json({ error: "Erro interno do servidor" });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor Node.js rodando na porta ${PORT}`);
});

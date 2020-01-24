import { element } from 'protractor';
import { BootService } from './boot.service'; //Serviço antes criado
import { Component, ViewChild, ElementRef } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection, AngularFirestoreDocument } from '@angular/fire/firestore'; //Importações do Firebase para a inserção no banco.
import { Observable } from 'rxjs';
import { map, timestamp } from 'rxjs/operators';
import { textosPadroes } from '../assets/textoPadrao/textosPadroes'; //objeto criado para guardar as mensagens de validação

//Interface para os atributos das mensagens
export interface Message {
  remetente?: string;
  mensagem: string;
  data?: Date;
}
//Interface para os atributos de ID para o retornodas mensagens
interface messageId extends Message {
  id: string;
}

//Import dos componentes principais
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})

export class AppComponent {
  @ViewChild('scrollframe', { static: false }) private myScrollContainer: ElementRef;
  msg: string;
  msgs: Message;//Interface de mensagens
  resultados: Message[];//Variavels que guarda a coleção de dados, para o retorno das mensagens e inserção no banco Firebase
  resultadosValidacao: Message[];//Usada para a vadidação em tela
  postsCol: AngularFirestoreCollection<Message>;
  posts: any;
  postDoc: AngularFirestoreDocument<Message>;
  post: Observable<Message>;
  public textos: textosPadroes = new textosPadroes();

  constructor(private chatBoot: BootService, public af: AngularFirestore) {
    this.initBoot()//Construtor padrão e metodo de inicialização do Serviço do Boot e do Firestone do Firebase
  }

  //Usado para o retorno do e0mail quando o usuário deseja pelo id trazer oque ele inseriu
  ngOnInit() {
    this.postsCol = this.af.collection('resultados');
    this.posts = this.postsCol.valueChanges();
  }
  //Método de inicialização do Boot, o mesmo inicia com a mensagem 'oi'
  initBoot() {
    this.resultados = []
    this.chatBoot.getResponse('oi')
      .subscribe((lista: any) => {
        lista.result.fulfillment.messages.forEach((element) => {
          this.resultados.push({ remetente: 'boot', mensagem: element.speech, data: lista.timestamp })
        });
      })
  }
  //Método que faz toda a regra do chat, este metodo envia as mensagens do imput para o Chat e recebe a mensagem que o mesmo envia, expondo na tela oque ele retorna, e criando a conversa
  sendMessage() {
    this.resultados.push({ remetente: 'eu', mensagem: this.msg, data: new Date() })
    this.chatBoot.getResponse(this.removerAcentos(this.msg))
      .subscribe((lista: any) => {
        lista.result.fulfillment.messages.forEach((element) => {
          this.addPost();
          this.resultados.push({ remetente: 'boot', mensagem: element.speech, data: lista.timestamp })
        });
        console.log(this.resultados);
      })

    this.msg = '';
  }
  //Método que faz a inserção final no firestone, guardando os dados antes inseridos pelo usuario
  addPost() {
    for (var i = 1; i < this.resultados.length; i++) {
      this.af.collection('resultados').add({ 'data': this.resultados[i].data, 'remetente': this.resultados[i].remetente, 'mensagem': this.resultados[i].mensagem });
      console.log('---------------------------Adicionou o Post--------------------------');
      // }
    }
  }

  //Método de retorno dos dados inseridos no banco por ID
  getPost(messageId) {
    this.postDoc = this.af.doc('resultados/' + messageId);
    this.post = this.postDoc.valueChanges();
  }
  
  //Método para a rolagem do chat ser mais fluida, descendo a cada nova mensagem
  ngAfterViewChecked() {
    this.scrollToBottom();
  }
  scrollToBottom(): void {
    try {
      this.myScrollContainer.nativeElement.scrollframe = this.myScrollContainer.nativeElement.scrollHeight;
    } catch (err) { }
  }

  //Método para tratamento das mensagens, removendo acentuações, ja que como todo banco de dados, o firestone recebe apenas caracteres ANSI.
  private removerAcentos(s) {
    return s.normalize('NFD').replace(/[\u0300-\u036f]/g, "")
  }


}
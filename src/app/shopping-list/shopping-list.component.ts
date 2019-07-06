import { Component } from '@angular/core';
import { AngularFirestore, AngularFirestoreDocument } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { AngularFireAuth } from '@angular/fire/auth';
import { ShoppingItem } from 'src/models/shopping-item';
import { Item } from 'src/models/item';

@Component({
  selector: 'app-shopping-list',
  templateUrl: './shopping-list.component.html',
  styleUrls: ['./shopping-list.component.css']
})
export class ShoppingListComponent {

  createItem = '';
  createItemPrice: number;
  shoppingTotal = 0;
  showLoginUserInputForm = false;
  showCreateUserInputForm = false;
  showTotal = false;
  email = '';
  password = '';
  // create doc of type Item that represents the individual GroceryItems nested collection
  shoppingItemsDoc: AngularFirestoreDocument<Item>;
  shoppingItems: Observable<ShoppingItem[]>;

  constructor(public afs: AngularFirestore, public afAuth: AngularFireAuth) {
    this.afAuth.auth.onAuthStateChanged(user => {
      if (user) {
        // show email in welcome message
        this.email = user.email;
        // call method that selects all items when user is authenticated
        this.selectItems(user.uid);
      }
    });
  }

  // async is not necessary here, but using it to control event loop
  async addItem() {
    const id = this.afs.createId();
    const shoppingItem: ShoppingItem = {
      price: this.createItemPrice,
      value: this.createItem,
      id: id
    };

    await this.shoppingItemsDoc.collection<ShoppingItem>('ShoppingItems').doc(id).set(shoppingItem)
      .then(() => {
          // when successful clear input field value here
          this.createItem = '';
          this.computeTotal(this.shoppingItems);
      })
      .catch((error) => {
        alert(error);
      });      
  }

  // async is not necessary here, but using it to control event loop
  async deleteItem(shoppingItem: ShoppingItem) {
    await this.shoppingItemsDoc.collection<ShoppingItem>('ShoppingItems').doc(shoppingItem.id).delete()
      .catch((error) => { alert(error); });
      this.computeTotal(this.shoppingItems);
  }

  showLoginUserForm() {
    this.showLoginUserInputForm = true;
  }

  showCreateUserForm() {
    this.showCreateUserInputForm = true;
  }

  createUser(email: string, password: string) {
    this.afAuth.auth.createUserWithEmailAndPassword(email, password)
      .then(() => {
          // on success hide create user input form and store variables in login
          // and then call the login method
          this.showCreateUserInputForm = false;
          this.loginUser(email, password);
      })
      .catch((error) => {
        alert(error);
      });
  }

  loginUser(email: string, password: string) {
    this.afAuth.auth.signInWithEmailAndPassword(email, password)
      .then(() => {
        // on success populate user variables and then select grocery items for that user
        this.selectItems(this.afAuth.auth.currentUser.uid);
      })
      .catch((error) => {
        alert(error);
      });
  }

  async selectItems(uid: string) {    
    this.shoppingItemsDoc = this.afs.doc<Item>('user/' + uid);
    this.shoppingItems = this.shoppingItemsDoc.collection<ShoppingItem>('ShoppingItems').valueChanges();
    // // turn on logging if you want to see how the requests are sent
    // this.shoppingItemsDoc.collection<ShoppingItem>('ShoppingItems').auditTrail().subscribe(console.log);
    this.computeTotal(this.shoppingItems);
  }

  // async is not necessary here, just controlling the event loop
  async logoutUser() {
    await this.afAuth.auth.signOut()
      .catch(function(error) { alert(error); });

    this.email = '';
    this.password = '';
    this.showLoginUserInputForm = false;
    this.showCreateUserInputForm = false;
  }

  cancelButton() {
    this.showLoginUserInputForm = false;
    this.showCreateUserInputForm = false;
  }

  computeTotal(cartItems){
    let total = 0;
    cartItems.subscribe(data => {
      data.forEach(dataItem =>{
        total += dataItem.price;    
      });
      this.shoppingTotal = total;
      total = 0;
    });
  }

  toggleTotal(){
    if(this.showTotal === true){
      this.showTotal = false;
    }
    else{
      this.showTotal = true;
    }
  }
}

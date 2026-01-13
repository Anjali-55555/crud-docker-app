import java.util.Scanner;

class BankAccount {
    int balance = 0;

    void deposit(int amount) {
        balance += amount;
        System.out.println("Deposited: " + amount);
    }

    void withdraw(int amount) {
        if (amount <= balance) {
            balance -= amount;
            System.out.println("Withdrawn: " + amount);
        } else {
            System.out.println("Insufficient Balance");
        }
    }

    void checkBalance() {
        System.out.println("Current Balance: " + balance);
    }
}

public class BankApp {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        BankAccount acc = new BankAccount();

        while (true) {
            System.out.println("\n1. Deposit\n2. Withdraw\n3. Balance\n4. Exit");
            int choice = sc.nextInt();

            if (choice == 1) acc.deposit(sc.nextInt());
            else if (choice == 2) acc.withdraw(sc.nextInt());
            else if (choice == 3) acc.checkBalance();
            else break;
        }
        sc.close();
    }
}

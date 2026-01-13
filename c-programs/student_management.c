#include <stdio.h>

struct Student {
    int id;
    char name[50];
    int marks;
};

int main() {
    struct Student s[5];
    int choice, count = 0;

    while (1) {
        printf("\n--- Student Management System ---\n");
        printf("1. Add Student\n");
        printf("2. Display Students\n");
        printf("3. Exit\n");
        printf("Enter choice: ");
        scanf("%d", &choice);

        if (choice == 1) {
            printf("Enter ID: ");
            scanf("%d", &s[count].id);
            printf("Enter Name: ");
            scanf("%s", s[count].name);
            printf("Enter Marks: ");
            scanf("%d", &s[count].marks);
            count++;
            printf("Student Added Successfully!\n");
        }
        else if (choice == 2) {
            for (int i = 0; i < count; i++) {
                printf("\nID: %d, Name: %s, Marks: %d",
                       s[i].id, s[i].name, s[i].marks);
            }
        }
        else if (choice == 3) {
            break;
        }
        else {
            printf("Invalid Choice\n");
        }
    }
    return 0;
}

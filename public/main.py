def print_multiplication_table():
    for i in range(1, 10):
        for j in range(1, 10):
            print(f"{i} x {j} = {i * j}")
        print()

if __name__ == "__main__":
    print_multiplication_table()

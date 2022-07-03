// @ts-nocheck

const easy_operations = ["+", "-"];
const not_easy_operations = ["+", "*", "-"];

function randint(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}

function get_simple(max_num, max_pow, operation) {
    if (operation == "*") {
        max_num = max_pow;
    }
    return [randint(1, max_num + 1), operation, randint(1, max_num + 1)];
}

function get_hard(num_elements, max_num, max_pow, current) {
    if (num_elements == 1) {
        current.push(randint(1, max_num));
        return current;
    }
    let next_el = null;
    let last_op = null;
    if (current.length != 0) {
        last_op = current[current.length - 1];
        if (last_op == "*") {
            next_el = randint(1, max_pow);
        }
    }
    if (next_el == null) {
        next_el = randint(1, max_num);
    }
    current.push(next_el);
    current.push(not_easy_operations[randint(0, 3)]);
    return get_hard(num_elements - 1, max_num, max_pow, current);
}

function generate_similar(number) {
    let rand1 = randint(Math.floor(number / 2) - 1, number - 1);
    let rand2 = randint(number + 1, number + Math.ceil(number / 2));
    let rand3 = number - randint(1, 5);
    if (number % 5 == 0) {
        rand2 = number + 5;
    }
    return shuffle([number, rand1, rand2, rand3]);
}

function shuffle(list) {
    return list.sort(() => 0.5 - Math.random());
}

function get_result(ex) {
    let ind = 1;
    let res = ex[0];
    let label = ex[0].toString();
    let next_el;
    let op;

    while (ind < ex.length) {
        op = ex[ind];
        next_el = ex[ind + 1];
        if (op == "+") {
            res += next_el;
            label = label.concat(" + ");
        }
        if (op == "-") {
            res -= next_el;
            label = label.concat(" - ");
        }
        if (op == "*") {
            res *= next_el;
            if (ind > 1) {
                label = "( ".concat(label, " )");
            }
            label = label.concat(" * ");
        }
        label = label.concat(next_el.toString());
        ind += 2;
    }
    const similar = generate_similar(res);
    return [label, res, similar];
}

/**
 *
 * @param {Number} step Challenge order to define challenge difficulty
 * @returns
 *  [
 *      label: string - challenge content
 *      res: number - correct answer
 *      similar: number[] - possible answers
 *  ]
 */
export function generateChallenge(step: number) {
    let op;
    let ex;

    if (step < 5) {
        op = easy_operations[randint(0, 2)];
        ex = get_simple(10, 1, op);
        return get_result(ex);
    }
    if (step < 10) {
        op = not_easy_operations[randint(0, 3)];
        ex = get_simple(10, 10, op);
        return get_result(ex);
    }
    if (step < 15) {
        op = easy_operations[randint(0, 2)];
        ex = get_simple(30, 1, op);
        return get_result(ex);
    }
    if (step < 20) {
        op = not_easy_operations[randint(0, 3)];
        ex = get_simple(30, 10, op);
        return get_result(ex);
    } else {
        ex = get_hard(3, 10, 10, []);
        return get_result(ex);
    }
}

// for (let i = 0; 20; i++) {
//     console.log(give_me_something(i))
// }

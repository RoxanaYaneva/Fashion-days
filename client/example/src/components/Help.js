
import React, { Component } from 'react';
import "./Main.css";

class Help extends Component {

    render() {
        return (
            <div className="main">
                <h1>Help</h1>
                <p>
                Връщането е лесно – само следвай посочените стъпки.
                Искаш да върнеш цяла поръчка или само един продукт? 
                Може да го направиш лесно в рамките на 30 дни от получаване на пратката. 
                Следвай стъпките: 

                    <ul>
                        <li>
                         Отиди в Профила си и избери секция Връщане на продукти. 
                        Там ще откриеш направените от теб поръчки, както и тези, които подлежат на връщане. Избери поръчка, след това – продукт/и, количество и причина
                        </li>
                        <li>
                        Въведи точен адрес, от който да вземем пратката. Може да избереш адрес, на който вече сме доставяли пратки или да добавиш нов.
                        </li>
                        <li>
                        Избери метод на плащане. Ако поръчката, която искаш да върнеш, е платена  с кредитна или дебитна карта, сумата ще бъде върната по сметката, свързана с твоята карта
                        </li>
                        <li>
                         Когато връщането бъде регистрирано, куриер ще дойде в рамките на 2-4 дни, за да вземе пратката с продуктите за връщане. Таксата, която трябва да платиш е 3 лв. за всеки генериран формуляр след завършване на посочените по-горе стъпки. Молим те предварително да подготвиш продуктите. Те трябва да бъдат в тяхната оригинална опаковка. Не е задължително да бъдат в доставната опаковка, с която са ти били доставени от куриера. След като предадеш пратката на куриера, ще те уведомим за статуса на твоето връщане чрез имейл и SMS, както следва: - Ще получиш информация, когато връщането пристигне в нашия склад. - Щом проверим статуса на върнатите продукти, ще те информираме дали всички условия за връщане са изпълнени. - Ще ти съобщим, когато плащането е извършено. Важно: всеки формуляр за връщане е асоцииран с една поръчка. Ако желаеш да върнеш продукти от различни поръчки, молим, следвай стъпките по-горе за всяка направена поръчка поотделно и приготви отделна пратка за всеки попълнен формуляр за връщане.
                        </li>
                    </ul>
                </p>
            </div>
        );
    }
}

export default Help;